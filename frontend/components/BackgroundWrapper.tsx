import React, { useState, useEffect } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface BackgroundWrapperProps {
  children: React.ReactNode;
  showOverlay?: boolean;
}

export default function BackgroundWrapper({ children, showOverlay = true }: BackgroundWrapperProps) {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  useEffect(() => {
    fetchBackgroundImage();
  }, []);

  const fetchBackgroundImage = async () => {
    try {
      const response = await fetch(`${API_URL}/api/images/background`);
      const data = await response.json();
      if (data.background_image_base64) {
        const imageUri = `data:image/png;base64,${data.background_image_base64}`;
        setBackgroundImage(imageUri);
      }
    } catch (error) {
      console.error('Error fetching background:', error);
    }
  };

  if (backgroundImage) {
    return (
      <ImageBackground source={{ uri: backgroundImage }} style={styles.backgroundImage} blurRadius={2}>
        {showOverlay && <View style={styles.overlay} />}
        {children}
      </ImageBackground>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});
