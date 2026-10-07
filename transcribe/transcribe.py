#!/usr/bin/env python3
"""
RecipeCut Local Whisper Transcription CLI
Converts audio voiceover into full.srt and ~30s chunk_NN.srt files for LLM prompt builder.
"""

import sys
import os
import argparse
from typing import List, Dict

def format_timestamp(seconds: float) -> str:
    """Formats float seconds into standard SRT timestamp HH:MM:SS,mmm"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

def write_srt(cues: List[Dict], filepath: str):
    """Writes a list of SRT cues to disk."""
    with open(filepath, "w", encoding="utf-8") as f:
        for i, cue in enumerate(cues, 1):
            start_str = format_timestamp(cue["start"])
            end_str = format_timestamp(cue["end"])
            text = cue["text"].strip()
            f.write(f"{i}\n{start_str} --> {end_str}\n{text}\n\n")

def chunk_cues(cues: List[Dict], chunk_duration: float = 30.0) -> List[List[Dict]]:
    """Splits full cues into ~30s chunks."""
    if not cues:
        return []
    chunks = []
    current_chunk = []
    chunk_start = cues[0]["start"]

    for i, cue in enumerate(cues):
        current_chunk.append(cue)
        elapsed = cue["end"] - chunk_start
        is_last = (i == len(cues) - 1)

        if elapsed >= chunk_duration or is_last:
            chunks.append(current_chunk)
            current_chunk = []
            if not is_last:
                chunk_start = cues[i + 1]["start"]

    return chunks

def transcribe_audio(audio_path: str, output_dir: str, chunk_duration: float = 30.0, model_size: str = "small.en"):
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print("[Error] 'faster-whisper' is not installed.")
        print("Please install via: pip install faster-whisper")
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)

    print(f"[*] Loading Faster-Whisper model '{model_size}' (compute_type='int8')...")
    model = WhisperModel(model_size, device="cpu", compute_type="int8")

    print(f"[*] Transcribing audio: {audio_path}...")
    segments, info = model.transcribe(audio_path, beam_size=5, word_timestamps=True)

    cues = []
    for segment in segments:
        cues.append({
            "start": segment.start,
            "end": segment.end,
            "text": segment.text.strip(),
        })

    # 1. Write full.srt
    full_srt_path = os.path.join(output_dir, "full.srt")
    write_srt(cues, full_srt_path)
    print(f"[+] Full transcript written to: {full_srt_path} ({len(cues)} segments, {info.duration:.1f}s)")

    # 2. Write chunk_NN.srt
    chunks = chunk_cues(cues, chunk_duration)
    for idx, chunk in enumerate(chunks, 1):
        chunk_path = os.path.join(output_dir, f"chunk_{idx:02d}.srt")
        write_srt(chunk, chunk_path)
        print(f"[+] Chunk {idx:02d} written to: {chunk_path} ({len(chunk)} cues)")

    print(f"\n[DONE] Successfully created {len(chunks)} chunks in '{output_dir}'.")
    print("You can now open RecipeCut Prompt Builder and load your SRT!")

def main():
    parser = argparse.ArgumentParser(description="RecipeCut Whisper Transcription CLI")
    parser.add_argument("audio", help="Path to input audio/video file (mp3, wav, m4a, mp4)")
    parser.add_argument("--out", "-o", default="./output_srt", help="Output directory for SRT files (default: ./output_srt)")
    parser.add_argument("--chunk-duration", "-c", type=float, default=30.0, help="Target chunk duration in seconds (default: 30)")
    parser.add_argument("--model", "-m", default="small.en", help="Whisper model size (default: small.en)")

    args = parser.parse_args()
    if not os.path.exists(args.audio):
        print(f"[Error] Audio file not found: {args.audio}")
        sys.exit(1)

    transcribe_audio(args.audio, args.out, args.chunk_duration, args.model)

if __name__ == "__main__":
    main()
