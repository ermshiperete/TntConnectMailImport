package org.tntconnect;

import models.Contact;
import models.ImportRequest;
import models.ImportResponse;

import java.io.*;
import java.sql.Connection;
import java.sql.DriverManager;

public class Main {
    public static void main(String[] args) {
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

        try (Connection connection = DriverManager.getConnection(url)) {
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
            String[] pairs = json.replace("{", "").replace("}", "").split(",");
            for (String pair : pairs) {
                String[] kv = pair.trim().split(":", 2);
                if (kv.length == 2) {
                    String key = kv[0].replace("\"", "").trim();
                    String value = kv[1].replace("\"", "").trim();
                    switch (key) {
                        case "action" -> request.setAction(value);
                        case "dbPath" -> request.setDbPath(value);
                        case "contactEmail" -> request.setContactEmail(value);
                        case "subject" -> request.setSubject(value);
                        case "body" -> request.setBody(value);
                        case "date" -> request.setDate(value);
                        case "direction" -> request.setDirection(value);
                    }
                }
            }
        } catch (Exception e) {
            // ignore parse errors
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
