import { type DragEvent, useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import {
  Download,
  FileArchive,
  ImagePlus,
  Loader2,
  Scissors,
  Trash2,
} from "lucide-react";
import { ToolHelpDialog } from "../components/ToolHelpDialog";

type SliceItem = {
  name: string;
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
};

type SliceResult = {
  fileName: string;
  originalWidth: number;
  originalHeight: number;
  columns: number;
  rows: number;
  slices: SliceItem[];
};

type LoadedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  close?: () => void;
};

const DEFAULT_CHUNK_SIZE = 4096;
const MAX_IMAGE_FILES = 5;
const MAX_IMAGE_FILE_SIZE = 50 * 1024 * 1024;

function getFileExt(file: File) {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".png")) {
    return { mime: "image/png", ext: "png" };
  }

  if (lowerName.endsWith(".webp")) {
    return { mime: "image/webp", ext: "webp" };
  }

  return { mime: "image/jpeg", ext: "jpeg" };
}

function toBlob(canvas: HTMLCanvasElement, mime: string) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("切片生成失败"));
        return;
      }

      resolve(blob);
    }, mime);
  });
}

async function loadImage(
  file: File,
  registerObjectUrl: (url: string) => void,
): Promise<LoadedImage> {
  if ("createImageBitmap" in window) {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    };
  }

  const url = URL.createObjectURL(file);
  registerObjectUrl(url);

  const image = new Image();
  image.decoding = "async";
  image.src = url;
  await image.decode();

  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
  };
}

function formatSliceMode(rows: number, columns: number) {
  if (rows > 1 && columns > 1) {
    return `${columns} 列 x ${rows} 行`;
  }

  if (rows > 1) {
    return `${rows} 行纵切`;
  }

  if (columns > 1) {
    return `${columns} 列横切`;
  }

  return "原图尺寸";
}

function formatPixels(value: number) {
  return `${value.toLocaleString("en-US")}px`;
}

function formatFileSize(bytes: number) {
  const megabytes = bytes / (1024 * 1024);

  return `${Number.isInteger(megabytes) ? megabytes : megabytes.toFixed(1)} MB`;
}

function isImageFile(file: File) {
  if (file.type.startsWith("image/")) {
    return true;
  }

  return /\.(avif|bmp|gif|jpe?g|png|tiff?|webp)$/i.test(file.name);
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function createZip(slices: SliceItem[]) {
  const zip = new JSZip();

  for (const slice of slices) {
    zip.file(slice.name, slice.blob);
  }

  return zip.generateAsync({ type: "blob" });
}

async function sliceOneFile(
  file: File,
  chunkWidth: number,
  chunkHeight: number,
  registerObjectUrl: (url: string) => void,
) {
  const image = await loadImage(file, registerObjectUrl);
  const columns = Math.ceil(image.width / chunkWidth);
  const rows = Math.ceil(image.height / chunkHeight);
  const { mime, ext } = getFileExt(file);
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const slices: SliceItem[] = [];

  for (let row = 0; row < rows; row += 1) {
    const top = row * chunkHeight;
    const bottom = Math.min((row + 1) * chunkHeight, image.height);
    const partHeight = bottom - top;

    for (let column = 0; column < columns; column += 1) {
      const left = column * chunkWidth;
      const right = Math.min((column + 1) * chunkWidth, image.width);
      const partWidth = right - left;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { alpha: false });

      if (!context) {
        throw new Error("Canvas 初始化失败");
      }

      canvas.width = partWidth;
      canvas.height = partHeight;
      context.drawImage(
        image.source,
        left,
        top,
        partWidth,
        partHeight,
        0,
        0,
        partWidth,
        partHeight,
      );

      const blob = await toBlob(canvas, mime);
      const previewUrl = URL.createObjectURL(blob);
      registerObjectUrl(previewUrl);

      slices.push({
        name: `${baseName}_r${String(row + 1).padStart(2, "0")}-c${String(
          column + 1,
        ).padStart(2, "0")}_x${String(left).padStart(5, "0")}-${String(
          right,
        ).padStart(5, "0")}_y${String(top).padStart(5, "0")}-${String(
          bottom,
        ).padStart(5, "0")}.${ext}`,
        blob,
        previewUrl,
        width: partWidth,
        height: partHeight,
      });
    }
  }

  image.close?.();

  return {
    fileName: file.name,
    originalWidth: image.width,
    originalHeight: image.height,
    columns,
    rows,
    slices,
  };
}

export function SliceTool() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlsRef = useRef<string[]>([]);
  const [chunkWidth, setChunkWidth] = useState(DEFAULT_CHUNK_SIZE);
  const [chunkHeight, setChunkHeight] = useState(DEFAULT_CHUNK_SIZE);
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<SliceResult[]>([]);
  const [status, setStatus] = useState("ready");
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);

  const allSlices = useMemo(
    () => results.flatMap((result) => result.slices),
    [results],
  );
  const totalSlices = allSlices.length;

  useEffect(() => () => revokeObjectUrls(), []);

  function registerObjectUrl(url: string) {
    objectUrlsRef.current.push(url);
  }

  function revokeObjectUrls() {
    for (const url of objectUrlsRef.current) {
      URL.revokeObjectURL(url);
    }

    objectUrlsRef.current = [];
  }

  function resetResults() {
    revokeObjectUrls();
    setResults([]);
  }

  function selectFiles(nextFiles: File[]) {
    if (processing) {
      return;
    }

    const imageFiles = nextFiles.filter(isImageFile);
    const filesWithinLimit = imageFiles.filter(
      (file) => file.size <= MAX_IMAGE_FILE_SIZE,
    );
    const limitedFiles = filesWithinLimit.slice(0, MAX_IMAGE_FILES);

    if (!imageFiles.length) {
      setStatus("invalid-file-type");
      return;
    }

    if (!filesWithinLimit.length) {
      setStatus("file-size");
      return;
    }

    resetResults();
    setFiles(limitedFiles);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (filesWithinLimit.length > MAX_IMAGE_FILES) {
      setStatus("file-limit");
      return;
    }

    if (filesWithinLimit.length < imageFiles.length) {
      setStatus("ignored-file-size");
      return;
    }

    if (imageFiles.length < nextFiles.length) {
      setStatus("ignored-file-type");
      return;
    }

    setStatus(`selected:${limitedFiles.length}`);
  }

  function clearAll() {
    resetResults();
    setFiles([]);
    setDragging(false);
    setStatus("cleared");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleDragEnter(event: DragEvent<HTMLElement>) {
    event.preventDefault();

    if (!processing) {
      setDragging(true);
    }
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = processing ? "none" : "copy";
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    const nextTarget = event.relatedTarget;

    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);

    if (processing) {
      return;
    }

    selectFiles(Array.from(event.dataTransfer.files));
  }

  async function runSlice() {
    if (!files.length) {
      setStatus("missing-files");
      return;
    }

    if (!Number.isInteger(chunkWidth) || chunkWidth <= 0) {
      setStatus("invalid-width");
      return;
    }

    if (!Number.isInteger(chunkHeight) || chunkHeight <= 0) {
      setStatus("invalid-height");
      return;
    }

    resetResults();
    setProcessing(true);
    setStatus(`processing:0/${files.length}`);

    try {
      const nextResults: SliceResult[] = [];

      for (let index = 0; index < files.length; index += 1) {
        const result = await sliceOneFile(
          files[index],
          chunkWidth,
          chunkHeight,
          registerObjectUrl,
        );
        nextResults.push(result);
        setResults([...nextResults]);
        setStatus(`processing:${index + 1}/${files.length}`);
      }

      const nextTotal = nextResults.reduce(
        (sum, result) => sum + result.slices.length,
        0,
      );
      setStatus(`done:${nextTotal}`);
    } catch (error) {
      setStatus(
        `error:${error instanceof Error ? error.message : "未知错误"}`,
      );
    } finally {
      setProcessing(false);
    }
  }

  async function downloadResult(result: SliceResult) {
    const blob = await createZip(result.slices);
    downloadBlob(blob, `${result.fileName}_slices.zip`);
  }

  async function downloadAll() {
    if (!allSlices.length) {
      return;
    }

    const blob = await createZip(allSlices);
    downloadBlob(blob, "figma_slices.zip");
  }

  function statusText() {
    if (status === "ready") {
      return "待处理";
    }

    if (status === "cleared") {
      return "已清空";
    }

    if (status === "missing-files") {
      return "请选择图片";
    }

    if (status === "invalid-file-type") {
      return "仅支持图片文件";
    }

    if (status === "ignored-file-type") {
      return "已忽略非图片文件";
    }

    if (status === "file-limit") {
      return `最多 ${MAX_IMAGE_FILES} 张，已保留前 ${MAX_IMAGE_FILES} 张`;
    }

    if (status === "file-size") {
      return `单张图片最大 ${formatFileSize(MAX_IMAGE_FILE_SIZE)}`;
    }

    if (status === "ignored-file-size") {
      return `已忽略超过 ${formatFileSize(MAX_IMAGE_FILE_SIZE)} 的图片`;
    }

    if (status === "invalid-width") {
      return "最大宽度需要大于 0";
    }

    if (status === "invalid-height") {
      return "最大高度需要大于 0";
    }

    if (status.startsWith("processing:")) {
      return `处理中 ${status.slice("processing:".length)}`;
    }

    if (status.startsWith("selected:")) {
      return `已选择 ${status.slice("selected:".length)} 张`;
    }

    if (status.startsWith("done:")) {
      return `完成 ${status.slice("done:".length)} 张`;
    }

    if (status.startsWith("error:")) {
      return `失败 ${status.slice("error:".length)}`;
    }

    return status;
  }

  function selectedFilesText() {
    if (!files.length) {
      return "no file selected";
    }

    if (files.length === 1) {
      return files[0].name;
    }

    return `${files.length} files selected`;
  }

  return (
    <div className="sliceTool">
      <header className="sliceHeader">
        <div>
          <span>slice tool</span>
          <div className="toolTitleRow">
            <h1>Figma图片切图</h1>
            <ToolHelpDialog title="Figma图片切图">
              <p>
                将超宽或超长图片按固定最大宽高切成多张图片，方便导入 Figma。
              </p>
              <ol>
                <li>设置单张切片的最大宽度和最大高度，默认 4096 x 4096。</li>
                <li>
                  点击 select images 或将图片拖入控制区，最多 {MAX_IMAGE_FILES} 张，
                  单张最大 {formatFileSize(MAX_IMAGE_FILE_SIZE)}。
                </li>
                <li>点击 start slice，工具会自动横切、纵切或切成宫格。</li>
                <li>检查预览后，可下载单张图片的全部切片或下载全部 ZIP。</li>
              </ol>
            </ToolHelpDialog>
          </div>
        </div>
        <div className="sliceStats" aria-label="Slice summary">
          <div>
            <strong>{files.length}</strong>
            <span>images</span>
          </div>
          <div>
            <strong>{totalSlices}</strong>
            <span>slices</span>
          </div>
        </div>
      </header>

      <section
        className="sliceControlPanel"
        aria-label="Slice controls"
        data-dragging={dragging}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="sliceFieldGrid">
          <label className="sliceField">
            <span>最大宽度</span>
            <input
              min="1"
              step="1"
              type="number"
              value={chunkWidth}
              onChange={(event) => setChunkWidth(Number(event.target.value))}
            />
          </label>
          <label className="sliceField">
            <span>最大高度</span>
            <input
              min="1"
              step="1"
              type="number"
              value={chunkHeight}
              onChange={(event) => setChunkHeight(Number(event.target.value))}
            />
          </label>
          <div className="sliceFileField">
            <span>图片</span>
            <div className="sliceFileControl">
              <button
                className="barButton"
                type="button"
                disabled={processing}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus size={16} />
                <span>select images</span>
              </button>
              <strong title={selectedFilesText()}>{selectedFilesText()}</strong>
            </div>
            <small className="sliceFileHint">
              drop images here / max {MAX_IMAGE_FILES} files /{" "}
              {formatFileSize(MAX_IMAGE_FILE_SIZE)} each
            </small>
            <input
              ref={fileInputRef}
              className="sliceNativeFileInput"
              accept="image/*"
              multiple
              type="file"
              onChange={(event) =>
                selectFiles(Array.from(event.currentTarget.files ?? []))
              }
            />
          </div>
        </div>

        <div className="sliceActionRow">
          <button
            className="primaryButton"
            type="button"
            disabled={processing}
            onClick={runSlice}
          >
            {processing ? (
              <Loader2 className="sliceSpinIcon" size={16} />
            ) : (
              <Scissors size={16} />
            )}
            <span>{processing ? "processing" : "start slice"}</span>
          </button>
          <button
            className="barButton"
            type="button"
            disabled={!totalSlices || processing}
            onClick={downloadAll}
          >
            <FileArchive size={16} />
            <span>download zip</span>
          </button>
          <button
            className="barButton"
            type="button"
            disabled={processing && !results.length}
            onClick={clearAll}
          >
            <Trash2 size={16} />
            <span>clear</span>
          </button>
        </div>
      </section>

      <section className="sliceResultPanel" aria-label="Slice results">
        <div className="sliceStatusBar" data-state={status.split(":")[0]}>
          <span>{statusText()}</span>
          <span>
            {formatPixels(chunkWidth)} x {formatPixels(chunkHeight)}
          </span>
        </div>

        {results.length ? (
          <div className="sliceResults">
            {results.map((result) => (
              <article className="sliceResultCard" key={result.fileName}>
                <header>
                  <div>
                    <strong>{result.fileName}</strong>
                    <span>
                      {formatPixels(result.originalWidth)} x{" "}
                      {formatPixels(result.originalHeight)} /{" "}
                      {formatSliceMode(result.rows, result.columns)} /{" "}
                      {result.slices.length} 张
                    </span>
                  </div>
                  <button
                    className="barButton"
                    type="button"
                    onClick={() => downloadResult(result)}
                  >
                    <Download size={16} />
                    <span>download</span>
                  </button>
                </header>

                <div className="sliceThumbGrid">
                  {result.slices.map((slice) => (
                    <figure className="sliceThumb" key={slice.name}>
                      <img src={slice.previewUrl} alt="" loading="lazy" />
                      <figcaption>
                        <span>{slice.name}</span>
                        <small>
                          {formatPixels(slice.width)} x {formatPixels(slice.height)}
                        </small>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="sliceEmptyState">
            <ImagePlus size={20} />
            <span>no slices</span>
          </div>
        )}
      </section>
    </div>
  );
}
