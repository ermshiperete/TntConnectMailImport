package org.tntconnect;

import java.io.*;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;

/**
 * A manual test application to simulate a browser calling the tntconnect-native-host
 * with a fixed request as provided by the user.
 */
public class ManualTestApp {

    public static void main(String[] args) {
        // The JSON request provided by the user, with "action":"importEmail" added.
        String jsonRequest = "{" +
            "\"action\":\"importEmail\"," +
            "\"dbPath\":\"/path/to/ToonTownCanada-ClarkKent.mpddb\"," +
            "\"dbUser\":\"Clark\"," +
            "\"contactEmail\":\"calvin.knox@toontown-canada.net\"," +
            "\"subject\":\"Test Email\"," +
            "\"body\":\"Hi Clar,\\r\\n\\r\\nThis is the promised test email.\\r\\nGreetings,\\r\\nCalvin\"," +
            "\"date\":\"2026-08-19T16:35:54.000Z\"," +
            "\"direction\":\"received\"" +
            "}";

        System.out.println("Starting Native Host Test...");

        try {
            // Simulate the native messaging host environment by redirecting System.in and System.out
            PipedInputStream hostIn = new PipedInputStream();
            PipedOutputStream clientOut = new PipedOutputStream(hostIn);

            PipedOutputStream hostOut = new PipedOutputStream();
            PipedInputStream clientIn = new PipedInputStream(hostOut);

            InputStream originalIn = System.in;
            PrintStream originalOut = System.out;
            PrintStream originalErr = System.err;

            System.setIn(hostIn);
            System.setOut(new PrintStream(hostOut));

            Thread hostThread = new Thread(() -> {
                try {
                    Main.main(new String[0]);
                } catch (Exception e) {
                    originalErr.println("Host error: " + e.getMessage());
                }
            });
            hostThread.setDaemon(true);
            hostThread.start();

            // Send message to host
            byte[] messageBytes = jsonRequest.getBytes(StandardCharsets.UTF_8);
            // The protocol in NativeProtocol.java uses native byte order
            ByteBuffer lengthBuffer = ByteBuffer.allocate(4).order(ByteOrder.nativeOrder());
            lengthBuffer.putInt(messageBytes.length);
            clientOut.write(lengthBuffer.array());
            clientOut.write(messageBytes);
            clientOut.flush();

            // Read response from host
            byte[] responseLengthBytes = new byte[4];
            int read = clientIn.readNBytes(responseLengthBytes, 0, 4);
            if (read == 4) {
                int responseLength = ByteBuffer.wrap(responseLengthBytes).order(ByteOrder.nativeOrder()).getInt();
                byte[] responseBytes = clientIn.readNBytes(responseLength);
                String responseJson = new String(responseBytes, StandardCharsets.UTF_8);

                System.setOut(originalOut);
                System.out.println("\n--- Received Response ---");
                System.out.println(responseJson);
                System.out.println("-------------------------\n");
            } else {
                System.setOut(originalOut);
                System.err.println("Failed to read response length from host.");
            }

            // Cleanup
            clientOut.close();
            hostIn.close();
            hostOut.close();
            clientIn.close();

            // Allow some time for the host thread to exit
            Thread.sleep(100);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
