package org.tntconnect;

import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintStream;
import java.sql.Connection;
import java.sql.DriverManager;

import models.Contact;
import models.ImportRequest;
import models.ImportResponse;

public class Main {
    static {
        // Suppress Jackcess/Commons-Logging/UCanAccess warnings as early as possible
        System.setProperty("org.apache.commons.logging.Log", "org.apache.commons.logging.impl.NoOpLog");
        System.setProperty("org.apache.commons.logging.simplelog.defaultlog", "fatal");

        // Redirect System.err to filter out the annoying Jackcess warning about default values
        PrintStream originalErr = System.err;
        System.setErr(new PrintStream(new OutputStream() {
            private StringBuilder line = new StringBuilder();
            @Override
            public void write(int b) throws IOException {
                if (b == '\n') {
                    String s = line.toString();
                    if (!s.contains("Default values should start and end with a double quote") &&
                        !s.contains("It may result in a data truncation error at runtime")) {
                        originalErr.println(s);
                    }
                    line.setLength(0);
                } else if (b != '\r') {
                    line.append((char) b);
                }
            }
        }));
    }

    public static void main(String[] args) {
        // Fix for HSQLDB 2.7+ security restriction
        System.setProperty("hsqldb.method_class_names", "net.ucanaccess.converters.*");

        try {
            Class.forName("net.ucanaccess.jdbc.UcanaccessDriver");
        } catch (ClassNotFoundException e) {
            System.err.println("UCanAccess driver not found: " + e.getMessage());
            System.exit(1);
        }

        try {
            InputStream stdin = System.in;
            OutputStream stdout = System.out;

            while (true) {
                String json = NativeProtocol.readMessage(stdin);
                ImportRequest request = parseRequest(json);

                if ("importEmail".equals(request.getAction())) {
                    ImportResponse response = handleImportEmail(request);
                    String responseJson = toJson(response);
                    NativeProtocol.writeMessage(stdout, responseJson);
                } else {
                    ImportResponse response = new ImportResponse();
                    response.setSuccess(false);
                    response.setError("Unknown action: " + request.getAction());
                    String responseJson = toJson(response);
                    NativeProtocol.writeMessage(stdout, responseJson);
                }
            }
        } catch (EOFException e) {
            // stdin closed, exit normally
        } catch (Exception e) {
            System.err.println("Fatal error: " + e.getMessage());
            System.exit(1);
        }
    }

    private static ImportResponse handleImportEmail(ImportRequest request) {
        ImportResponse response = new ImportResponse();
        String url = "jdbc:ucanaccess://" + request.getDbPath() + ";immediatelyReleaseResources=true;openExclusive=true;";

        try (Connection connection = DriverManager.getConnection(url, null, "tntMPD")) {
            ContactManager contactManager = new ContactManager(connection);
            HistoryManager historyManager = new HistoryManager(connection);

            Contact contact = contactManager.findContactByEmail(request.getContactEmail());
            if (contact == null) {
                response.setSuccess(false);
                response.setError("Contact not found for email: " + request.getContactEmail());
                return response;
            }

            return historyManager.createHistory(request, contact);
        } catch (Exception e) {
            response.setSuccess(false);
            response.setError(e.getMessage());
            return response;
        }
    }

    private static ImportRequest parseRequest(String json) {
        ImportRequest request = new ImportRequest();
        try {
            // A more robust regex-based parser to handle quoted strings with special characters
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\"(\\w+)\"\\s*:\\s*(\"(?:[^\"\\\\]++|\\\\.)*+\"|[^,{}]+)");
            java.util.regex.Matcher matcher = pattern.matcher(json);
            while (matcher.find()) {
                String key = matcher.group(1);
                String value = matcher.group(2);
                if (value.startsWith("\"") && value.endsWith("\"")) {
                    // Remove quotes and unescape common characters
                    value = value.substring(1, value.length() - 1)
                            .replace("\\\"", "\"")
                            .replace("\\\\", "\\")
                            .replace("\\r", "\r")
                            .replace("\\n", "\n")
                            .replace("\\t", "\t");
                } else {
                    value = value.trim();
                }

                switch (key) {
                    case "action" -> request.setAction(value);
                    case "dbPath" -> request.setDbPath(value);
                    case "dbUser" -> request.setDbUser(value);
                    case "contactEmail" -> request.setContactEmail(value);
                    case "subject" -> request.setSubject(value);
                    case "body" -> request.setBody(value);
                    case "date" -> request.setDate(value);
                    case "direction" -> request.setDirection(value);
                }
            }
        } catch (Exception e) {
            System.err.println("Parse error: " + e.getMessage());
        }
        return request;
    }

    private static String toJson(ImportResponse response) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"success\":").append(response.isSuccess());
        if (response.getHistoryId() != null) {
            sb.append(",\"historyId\":").append(response.getHistoryId());
        }
        if (response.getError() != null) {
            sb.append(",\"error\":\"").append(escapeJson(response.getError())).append("\"");
        }
        sb.append("}");
        return sb.toString();
    }

    private static String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
