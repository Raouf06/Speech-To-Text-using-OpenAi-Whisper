import React, { useState, useEffect } from 'react';
import { View, Button, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';

export default function App() {
  const [recording, setRecording] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);

  const startRecording = async () => {
    try {
      console.log('Requesting permissions...');
      await Audio.requestPermissionsAsync();

      console.log('Starting recording...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = async () => {
  console.log('Stopping recording...');
  setLoading(true);
  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    console.log('Recording stopped and stored at', uri);
    setRecording(null);

    // Ensure the file is fully written before uploading
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists || fileInfo.size === 0) {
      console.error('Audio file not saved correctly.');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', {
      uri: uri,
      name: 'audio.wav',
      type: 'audio/wav',
    });

    const response = await axios.post('http://192.168.1.106:5000/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    setTranscription(response.data.transcription);
  } catch (error) {
    console.error('Error uploading audio:', error);
  }
  setLoading(false);
};


  return (
    <View style={styles.container}>
      <Button
        title={recording ? 'Stop Recording' : 'Start Recording'}
        onPress={recording ? stopRecording : startRecording}
        color={recording ? 'red' : 'green'}
      />
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      {transcription && (
        <View style={styles.transcriptionContainer}>
          <Text style={styles.transcriptionTitle}>Transcription:</Text>
          <Text>{transcription}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  transcriptionContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  transcriptionTitle: {
    fontWeight: 'bold',
  },
});
