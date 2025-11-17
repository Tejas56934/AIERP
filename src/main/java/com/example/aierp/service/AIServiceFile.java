package com.example.aierp.service;

import net.sourceforge.tess4j.Tesseract;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;

@Service
public class AIServiceFile {

    public String processFileAndQuery(MultipartFile file, String query) {
        try {
            if (file == null || file.isEmpty()) {
                return "No file uploaded.";
            }

            String fileName = file.getOriginalFilename();
            if (fileName == null) {
                return "Invalid file name.";
            }

            // Save temporarily to process
            File tempFile = File.createTempFile("upload-", "-" + fileName);
            file.transferTo(tempFile);

            String extractedText = "";



            if (fileName.endsWith(".txt")) {
                // ✅ Read plain text file content
                extractedText = new String(Files.readAllBytes(tempFile.toPath()));
            }
            else if (fileName.endsWith(".pdf")) {
                // ✅ Extract text from PDF
                PDDocument document = PDDocument.load(tempFile);
                PDFTextStripper stripper = new PDFTextStripper();
                extractedText = stripper.getText(document);
                document.close();
            }
            else if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".png")) {
                try {
                    // ✅ Read text from image using Tesseract OCR
                    Tesseract tesseract = new Tesseract();
                    tesseract.setDatapath("C:/Program Files/Tesseract-OCR/tessdata"); // update path if needed
                    extractedText = tesseract.doOCR(tempFile);
                } catch (Exception e) {
                    extractedText = "OCR processing not available. Please ensure Tesseract is installed.";
                }
            }
            else {
                extractedText = "Unsupported file type: " + fileName;
            }

            tempFile.delete(); // cleanup temporary file

            // ✅ Combine the extracted text with query
            return "File read successfully.\n\nFile Name: " + fileName +
                    "\n\nExtracted Text:\n" + extractedText +
                    "\n\nUser Query: " + query;

        } catch (Exception e) {
            e.printStackTrace();
            return "Error processing file: " + e.getMessage();
        }
    }
}
