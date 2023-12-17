

import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Button,
  StyleSheet,
  Text,
  Image,
  SafeAreaView,
  ScrollView,
  View,
  TouchableOpacity,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: [
    {
      index: number;
      message: {
        role: string;
        content: string;
      };
    }
  ];
}

export default function App() {

  // State to hold the selected image 
  const [image, setImage] = useState(null);
  const [openAI, setOpenAI] = useState<OpenAIResponse| null>(null);
  const [openAILoading, setOpenAILoading] = useState(false);
  const [status, setStatus] = useState("");
  const [extractedText, setExtractedText] =
    useState("");

  
  // Function to pick an image from the 
  // device's gallery 
  const pickImageGallery = async () => {
    let result: any =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        base64: true,
        allowsMultipleSelection: false,
      });
    if (!result.canceled) {

      // Perform OCR on the selected image 
      performOCR(result.assets[0]);

      // Set the selected image in state 
      setImage(result.assets[0].uri);
    }
  };

  // Function to capture an image using the 
  // device's camera 
  const pickImageCamera = async () => {
    let result: any = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      allowsMultipleSelection: false,
    });
    if (!result.canceled) {

      // Perform OCR on the captured image 
      // Set the captured image in state 
      performOCR(result.assets[0]);
      setImage(result.assets[0].uri);
    }
  };

  // Function to perform OCR on an image 
  // and extract text 
  const performOCR = (file: any) => {
    let myHeaders = new Headers();
    myHeaders.append(
      "apikey",
      "FEmvQr5uj99ZUvk3essuYb6P5lLLBS20"
    );
    myHeaders.append(
      "Content-Type",
      "multipart/form-data"
    );

    let raw = file;
    let requestOptions: any = {
      method: "POST",
      redirect: "follow",
      headers: myHeaders,
      body: raw,
    };

    // Send a POST request to the OCR API 
    fetch(
      "https://api.apilayer.com/image_to_text/upload", requestOptions
    )
      .then((response) => response.json())
      .then((result) => {

        // Set the extracted text in state 
        setExtractedText(result["all_text"]);
      })
      .catch((error) => console.log("error", error));
  };

  const callOpenAI = async () => {
    if (extractedText) {
      try {
        setOpenAILoading(true);
        setStatus('Calling OpenAI API...');

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: "resolva em pt-br com respostas curtas" + extractedText,
              },
            ],
          }),
        });

        setOpenAILoading(false);
        setStatus('');
        if (!response.ok) {
          setStatus(`HTTP error! Status: ${response.status}`);
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log(result);
        setOpenAI(result);

      } catch (error) {
        console.error('Error calling OpenAI API:', error);
      }
    }
  };





  return (
    <ScrollView>
      <SafeAreaView style={styles.container}>
        <Text style={styles.heading}>Quest Lens</Text>


        <View style={styles.buttonContainer}>
          <Button title="Imagem da galeria" onPress={pickImageGallery} />
        </View>
        <View style={styles.buttonContainer}>
        <Button title="Imagem da camera" onPress={pickImageCamera} />
        </View> 

        {image && (
          <Image
            source={{ uri: image }}
            style={styles.image}
          />
        )}

        <Text style={styles.text1}>Extracted text:</Text>
        <Text style={styles.extractedText}>{extractedText}</Text>

        <TouchableOpacity
          style={styles.openAiButton}
          onPress={callOpenAI}
          disabled={openAILoading}
        >
          <Text style={styles.buttonText}>
            {openAILoading ? 'Loading...' : 'Call OpenAI'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.status}>
          {status}
          {openAI?.choices[0].message.content}
        </Text>

        <StatusBar style="auto" />
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 70,
    color: "green",
    textAlign: "center",
  },
  heading2: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "black",
    textAlign: "center",
  },
  buttonContainer: {
    backgroundColor: "#d22121",
    flexDirection: "column",
    justifyContent: "space-between",
    marginBottom: 20,
    borderRadius: 5,
  },
  image: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
    marginBottom: 20,
  },
  text1: {
    fontSize: 18,
    marginBottom: 10,
    color: "black",
    fontWeight: "bold",
  },
  extractedText: {
    fontSize: 16,
    marginBottom: 20,
    color: "black",
  },
  openAiButton: {
    backgroundColor: "#3498db",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  status: {
    fontSize: 16,
    color: "black",
  },
});
