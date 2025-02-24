
import { supabase } from "@/integrations/supabase/client";
import { AudioRecorder } from "./AudioRecorder";
import { encodeAudioData } from "./audioEncoder";

export class RealtimeChat {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement;
  private recorder: AudioRecorder | null = null;

  constructor(private onMessage: (message: any) => void) {
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
    this.audioEl.volume = 1.0;
  }

  async init() {
    try {
      const tokenResponse = await supabase.functions.invoke("generate-realtime-token");
      const data = await tokenResponse.data;
      
      if (!data?.client_secret?.value) {
        throw new Error("Failed to get ephemeral token");
      }

      const EPHEMERAL_KEY = data.client_secret.value;

      this.pc = new RTCPeerConnection();

      this.pc.ontrack = e => {
        if (!this.audioEl.srcObject) {
          this.audioEl.srcObject = new MediaStream([e.track]);
        }
      };

      const ms = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      const audioTrack = ms.getAudioTracks()[0];
      this.pc.addTrack(audioTrack, ms);

      this.dc = this.pc.createDataChannel("oai-events");
      this.dc.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        console.log("Received event:", event);
        this.onMessage(event);
      });

      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // Use the more cost-effective model
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-mini"; // Changed to mini version
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp"
        },
      });

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      
      await this.pc.setRemoteDescription(answer);
      console.log("WebRTC connection established");

      this.recorder = new AudioRecorder((audioData) => {
        if (this.dc?.readyState === 'open') {
          this.dc.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encodeAudioData(audioData)
          }));
        }
      });
      await this.recorder.start();

    } catch (error) {
      console.error("Error initializing chat:", error);
      throw error;
    }
  }

  async sendMessage(text: string) {
    if (!this.dc || this.dc.readyState !== 'open') {
      throw new Error('Data channel not ready');
    }

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text
          }
        ]
      }
    };

    this.dc.send(JSON.stringify(event));
    this.dc.send(JSON.stringify({type: 'response.create'}));
  }

  disconnect() {
    this.recorder?.stop();
    if (this.audioEl.srcObject instanceof MediaStream) {
      this.audioEl.srcObject.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      this.audioEl.srcObject = null;
    }
    this.dc?.close();
    this.pc?.close();
  }
}
