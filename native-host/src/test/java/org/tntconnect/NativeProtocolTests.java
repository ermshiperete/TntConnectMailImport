package org.tntconnect;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.*;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

public class NativeProtocolTests {
    @Test
    void readMessageReadsLengthPrefixedJson(@TempDir Path tempDir) throws Exception {
        Path file = tempDir.resolve("test.bin");
        String json = "{\"test\":true}";
        try (FileOutputStream fos = new FileOutputStream(file.toFile())) {
            fos.write(new byte[] {0, 0, 0, (byte) (json.getBytes("UTF-8").length)});
            fos.write(json.getBytes("UTF-8"));
        }

        try (FileInputStream fis = new FileInputStream(file.toFile())) {
            String result = NativeProtocol.readMessage(fis);
            assertEquals(json, result);
        }
    }

    @Test
    void writeMessageWritesLengthPrefixedJson(@TempDir Path tempDir) throws Exception {
        Path file = tempDir.resolve("test.bin");
        String json = "{\"test\":true}";

        try (FileOutputStream fos = new FileOutputStream(file.toFile())) {
            NativeProtocol.writeMessage(fos, json);
        }

        try (FileInputStream fis = new FileInputStream(file.toFile())) {
            byte[] lengthBytes = fis.readNBytes(4);
            int length = ((lengthBytes[0] & 0xFF) << 24) | ((lengthBytes[1] & 0xFF) << 16) | ((lengthBytes[2] & 0xFF) << 8) | (lengthBytes[3] & 0xFF);
            byte[] messageBytes = fis.readNBytes(length);
            String result = new String(messageBytes, "UTF-8");
            assertEquals(json, result);
        }
    }
}
