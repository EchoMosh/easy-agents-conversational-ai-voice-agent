
export class RealtimeChat {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private isRecording = false;
  private onMessage: (message: any) => void;
  private language: string;

  constructor(onMessage: (message: any) => void, language: string = 'en') {
    this.onMessage = onMessage;
    this.language = language;
  }

  async init() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      
      this.mediaRecorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data);
          
          // Convert the audio chunks to base64
          const blob = new Blob(this.chunks, { type: 'audio/webm' });
          const reader = new FileReader();
          
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            
            // Send to Supabase edge function instead of direct API endpoint
            const response = await fetch('https://ahpmmgnkksrbpthniptg.supabase.co/functions/v1/voice-to-text', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({
                audio: base64Audio,
                language: this.language,
              }),
            });
            
            if (!response.ok) {
              console.error('Voice-to-text error:', await response.text());
              return;
            }
            
            const data = await response.json();
            if (data.text) {
              this.onMessage({
                type: 'transcription',
                text: data.text,
              });
            }
          };
          
          reader.readAsDataURL(blob);
          this.chunks = []; // Clear the chunks for the next recording
        }
      };

      this.mediaRecorder.onstart = () => {
        this.isRecording = true;
      };

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
      };

      this.startRecording();
    } catch (error) {
      console.error('Error initializing media recorder:', error);
      throw error;
    }
  }

  startRecording() {
    if (this.mediaRecorder && !this.isRecording) {
      this.mediaRecorder.start(1000); // Capture in 1-second intervals
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
  }

  disconnect() {
    if (this.mediaRecorder) {
      if (this.isRecording) {
        this.stopRecording();
      }
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  }
}
