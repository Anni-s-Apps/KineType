export interface SrtCue {
  id: number;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
}

export interface SrtChunk {
  chunkIndex: number;
  startTime: number;
  endTime: number;
  duration: number;
  cues: SrtCue[];
  fullText: string;
}

/**
 * Converts HH:MM:SS,mmm or HH:MM:SS.mmm to seconds
 */
export function timeStringToSeconds(timeStr: string): number {
  const parts = timeStr.trim().replace(',', '.').split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  }
  if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }
  return parseFloat(timeStr) || 0;
}

/**
 * Formats seconds into HH:MM:SS,mmm
 */
export function secondsToSrtTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.floor((totalSeconds % 1) * 1000);

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
}

/**
 * Parses raw SRT string into array of SrtCue
 */
export function parseSrt(srtContent: string): SrtCue[] {
  const normalized = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.trim().split(/\n\s*\n/);
  const cues: SrtCue[] = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    let timeLineIdx = 1;
    if (!lines[0].match(/^\d+$/) && lines[0].includes('-->')) {
      timeLineIdx = 0;
    }

    const timeLine = lines[timeLineIdx];
    if (!timeLine || !timeLine.includes('-->')) continue;

    const [startStr, endStr] = timeLine.split('-->');
    const startTime = timeStringToSeconds(startStr);
    const endTime = timeStringToSeconds(endStr);
    const textLines = lines.slice(timeLineIdx + 1).join(' ').trim();

    cues.push({
      id: cues.length + 1,
      startTime,
      endTime,
      text: textLines,
    });
  }

  return cues;
}

/**
 * Splits SRT cues into chunks of ~targetChunkDuration seconds (default 30s)
 */
export function chunkSrt(cues: SrtCue[], targetChunkDuration = 30): SrtChunk[] {
  if (cues.length === 0) return [];

  const chunks: SrtChunk[] = [];
  let currentChunkCues: SrtCue[] = [];
  let chunkStartTime = cues[0].startTime;
  let chunkIndex = 1;

  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    currentChunkCues.push(cue);

    const chunkElapsed = cue.endTime - chunkStartTime;
    const isLast = i === cues.length - 1;

    if (chunkElapsed >= targetChunkDuration || isLast) {
      const chunkEndTime = cue.endTime;
      chunks.push({
        chunkIndex,
        startTime: chunkStartTime,
        endTime: chunkEndTime,
        duration: Number((chunkEndTime - chunkStartTime).toFixed(2)),
        cues: [...currentChunkCues],
        fullText: currentChunkCues.map((c) => c.text).join(' '),
      });

      chunkIndex++;
      currentChunkCues = [];
      if (!isLast) {
        chunkStartTime = cues[i + 1].startTime;
      }
    }
  }

  return chunks;
}
