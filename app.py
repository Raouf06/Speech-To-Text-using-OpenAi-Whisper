from flask import Flask, render_template, request, jsonify
import whisper
import pyaudio
import wave
import threading

app = Flask(__name__)

is_recording = False
audio_frames = []
audio_thread = None

# Don't touch these plz
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 48000
CHUNK = 1024
OUTPUT_FILE = "recorded_audio.wav"

model = whisper.load_model("base")

def record_audio():
    global is_recording, audio_frames
    p = pyaudio.PyAudio()
    stream = p.open(format=FORMAT, channels=CHANNELS, rate=RATE, input=True, frames_per_buffer=CHUNK)
    audio_frames = []

    while is_recording:
        data = stream.read(CHUNK)
        audio_frames.append(data)

    stream.stop_stream()
    stream.close()
    p.terminate()

    with wave.open(OUTPUT_FILE, "wb") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(p.get_sample_size(FORMAT))
        wf.setframerate(RATE)
        wf.writeframes(b"".join(audio_frames))

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/start", methods=["POST"])
def start_recording():
    global is_recording, audio_thread
    is_recording = True
    audio_thread = threading.Thread(target=record_audio)
    audio_thread.start()
    return jsonify({"status": "recording started"})

@app.route("/stop", methods=["POST"])
def stop_recording():
    global is_recording, audio_thread
    is_recording = False
    if audio_thread is not None:
        audio_thread.join()

    result = model.transcribe(OUTPUT_FILE)
    transcription = result["text"]
    return jsonify({"transcription": transcription})

if __name__ == "__main__":
    app.run(debug=True)
