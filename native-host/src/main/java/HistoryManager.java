package org.tntconnect;

import models.Contact;
import models.History;
import models.HistoryContact;
import models.ImportRequest;
import models.ImportResponse;

import java.sql.*;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Random;

public class HistoryManager {
    private final Connection connection;
    private final Random random = new Random();

    public HistoryManager(Connection connection) {
        this.connection = connection;
    }

    public int getAvailableId() throws SQLException {
        int id;
        do {
            id = random.nextInt();
        } while (id <= 0 || idExists("History", "HistoryID", id));
        return id;
    }

    private boolean idExists(String table, String column, int id) throws SQLException {
        String sql = "SELECT COUNT(*) FROM " + table + " WHERE " + column + " = ?";
        PreparedStatement stmt = connection.prepareStatement(sql);
        stmt.setInt(1, id);
        ResultSet rs = stmt.executeQuery();
        boolean exists = rs.next() && rs.getInt(1) > 0;
        rs.close();
        stmt.close();
        return exists;
    }

    public ImportResponse createHistory(ImportRequest request, Contact contact) {
        ImportResponse response = new ImportResponse();
        try {
            connection.setAutoCommit(false);

            int historyId = getAvailableId();

            String duplicateCheck = "SELECT COUNT(*) FROM History h JOIN HistoryContact hc ON h.HistoryID = hc.HistoryID WHERE hc.ContactID = ? AND h.TaskTypeID = ? AND h.HistoryDate = ? AND h.HistoryResultID = ?";
            PreparedStatement dupStmt = connection.prepareStatement(duplicateCheck);
            dupStmt.setInt(1, contact.getContactId());
            dupStmt.setInt(2, 100);
            dupStmt.setTimestamp(3, Timestamp.from(OffsetDateTime.parse(request.getDate()).toInstant()));
            dupStmt.setInt(4, "received".equals(request.getDirection()) ? 2 : 1);
            ResultSet dupRs = dupStmt.executeQuery();
            boolean isDuplicate = dupRs.next() && dupRs.getInt(1) > 0;
            dupRs.close();
            dupStmt.close();

            if (isDuplicate) {
                connection.rollback();
                response.setSuccess(false);
                response.setError("Duplicate history entry");
                return response;
            }

            String insertHistory = "INSERT INTO History (HistoryID, TaskTypeID, Description, HistoryDate, Notes, HistoryResultID, LastEdit, LoggedByUserID, InMPDWeeklyUpdate, IsChallenge, IsThank, IsMassMailing, AutoGenCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            PreparedStatement historyStmt = connection.prepareStatement(insertHistory);
            historyStmt.setInt(1, historyId);
            historyStmt.setInt(2, 100);
            historyStmt.setString(3, truncate(request.getSubject(), 147));
            historyStmt.setTimestamp(4, Timestamp.from(OffsetDateTime.parse(request.getDate()).toInstant()));
            historyStmt.setString(5, request.getBody());
            historyStmt.setInt(6, "received".equals(request.getDirection()) ? 2 : 1);
            historyStmt.setTimestamp(7, Timestamp.valueOf(LocalDateTime.now()));
            historyStmt.setInt(8, 0);
            historyStmt.setBoolean(9, false);
            historyStmt.setBoolean(10, false);
            historyStmt.setBoolean(11, false);
            historyStmt.setBoolean(12, false);
            historyStmt.setString(13, "");
            historyStmt.executeUpdate();
            historyStmt.close();

            int historyContactId = getAvailableId();
            String insertHistoryContact = "INSERT INTO HistoryContact (HistoryContactID, HistoryID, ContactID) VALUES (?, ?, ?)";
            PreparedStatement hcStmt = connection.prepareStatement(insertHistoryContact);
            hcStmt.setInt(1, historyContactId);
            hcStmt.setInt(2, historyId);
            hcStmt.setInt(3, contact.getContactId());
            hcStmt.executeUpdate();
            hcStmt.close();

            if ("received".equals(request.getDirection())) {
                String updateContact = "UPDATE Contact SET LastLetterDate = ?, LastEdit = ? WHERE ContactID = ?";
                PreparedStatement contactStmt = connection.prepareStatement(updateContact);
                contactStmt.setTimestamp(1, Timestamp.valueOf(LocalDateTime.now()));
                contactStmt.setTimestamp(2, Timestamp.valueOf(LocalDateTime.now()));
                contactStmt.setInt(3, contact.getContactId());
                contactStmt.executeUpdate();
                contactStmt.close();
            }

            connection.commit();
            response.setSuccess(true);
            response.setHistoryId(historyId);
        } catch (Exception e) {
            try {
                connection.rollback();
            } catch (SQLException ex) {
                // ignore
            }
            response.setSuccess(false);
            response.setError(e.getMessage());
        } finally {
            try {
                connection.setAutoCommit(true);
            } catch (SQLException e) {
                // ignore
            }
        }
        return response;
    }

    private String truncate(String value, int maxLength) {
        if (value == null) return "";
        if (value.length() <= maxLength) return value;
        return value.substring(0, maxLength - 3) + "...";
    }
}
