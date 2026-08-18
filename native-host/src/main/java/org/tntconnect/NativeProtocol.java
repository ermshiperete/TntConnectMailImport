package org.tntconnect;

import java.io.*;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;

public class NativeProtocol {
    public static String readMessage(InputStream in) throws IOException {
        byte[] lengthBytes = in.readNBytes(4);
        if (lengthBytes.length < 4) {
            throw new EOFException("Could not read message length");
        }
        int length = ByteBuffer.wrap(lengthBytes).order(ByteOrder.nativeOrder()).getInt();
        if (length <= 0) {
            throw new IOException("Invalid message length: " + length);
        }
        byte[] messageBytes = in.readNBytes(length);
        if (messageBytes.length < length) {
            throw new EOFException("Could not read full message");
        }
        return new String(messageBytes, StandardCharsets.UTF_8);
    }

    public static void writeMessage(OutputStream out, String message) throws IOException {
        byte[] messageBytes = message.getBytes(StandardCharsets.UTF_8);
        ByteBuffer buffer = ByteBuffer.allocate(4 + messageBytes.length).order(ByteOrder.nativeOrder());
        buffer.putInt(messageBytes.length);
        buffer.put(messageBytes);
        out.write(buffer.array());
        out.flush();
    }
}
