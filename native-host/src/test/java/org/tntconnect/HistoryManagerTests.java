package org.tntconnect;

import models.Contact;
import org.tntconnect.HistoryManager;
import models.ImportRequest;
import models.ImportResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.sql.*;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

public class HistoryManagerTests {
    @Test
    void createHistoryInsertsRow(@TempDir Path tempDir) throws Exception {
        Path dbPath = tempDir.resolve("test.mpddb");
        try (Connection conn = createTestDb(dbPath)) {
            Statement stmt = conn.createStatement();
            stmt.execute("INSERT INTO Contact (ContactID, Email1) VALUES (1, 'john@example.com')");
            stmt.close();

            HistoryManager manager = new HistoryManager(conn);
            ImportRequest request = new ImportRequest();
            request.setContactEmail("john@example.com");
            request.setSubject("Test Subject");
            request.setBody("Test body");
            request.setDate("2024-01-01T12:00:00.000Z");
            request.setDirection("received");

            Contact contact = new Contact();
            contact.setContactId(1);
            contact.setEmail1("john@example.com");

            ImportResponse response = manager.createHistory(request, contact);

            if (!response.isSuccess()) {
                System.err.println("createHistory failed: " + response.getError());
            }
            assertTrue(response.isSuccess(), () -> "Error: " + response.getError());
            assertNotNull(response.getHistoryId());

            Statement checkStmt = conn.createStatement();
            ResultSet rs = checkStmt.executeQuery("SELECT COUNT(*) FROM History WHERE HistoryID = " + response.getHistoryId());
            assertTrue(rs.next());
            assertEquals(1, rs.getInt(1));
            rs.close();
            checkStmt.close();
        }
    }

    @Test
    void createHistoryUpdatesLastLetterDate(@TempDir Path tempDir) throws Exception {
        Path dbPath = tempDir.resolve("test.mpddb");
        try (Connection conn = createTestDb(dbPath)) {
            Statement stmt = conn.createStatement();
            stmt.execute("INSERT INTO Contact (ContactID, Email1, LastLetterDate) VALUES (1, 'john@example.com', '2023-01-01 00:00:00')");
            stmt.close();

            HistoryManager manager = new HistoryManager(conn);
            ImportRequest request = new ImportRequest();
            request.setContactEmail("john@example.com");
            request.setSubject("Test");
            request.setBody("Body");
            request.setDate("2024-01-01T12:00:00.000Z");
            request.setDirection("received");

            Contact contact = new Contact();
            contact.setContactId(1);
            contact.setEmail1("john@example.com");

            manager.createHistory(request, contact);

            Statement checkStmt = conn.createStatement();
            ResultSet rs = checkStmt.executeQuery("SELECT LastLetterDate FROM Contact WHERE ContactID = 1");
            assertTrue(rs.next());
            assertNotNull(rs.getTimestamp("LastLetterDate"));
            rs.close();
            checkStmt.close();
        }
    }

    private Connection createTestDb(Path path) throws SQLException, ClassNotFoundException {
        Class.forName("org.hsqldb.jdbc.JDBCDriver");
        Connection conn = DriverManager.getConnection("jdbc:hsqldb:file:" + path.toString(), "SA", "");
        Statement stmt = conn.createStatement();
        stmt.execute("CREATE TABLE Contact (ContactID INTEGER PRIMARY KEY, Email1 VARCHAR(255), Email2 VARCHAR(255), Email3 VARCHAR(255), SpouseEmail1 VARCHAR(255), SpouseEmail2 VARCHAR(255), SpouseEmail3 VARCHAR(255), LastEdit TIMESTAMP, LastLetterDate TIMESTAMP)");
        stmt.execute("CREATE TABLE History (HistoryID INTEGER PRIMARY KEY, TaskTypeID INTEGER, Description VARCHAR(150), HistoryDate TIMESTAMP, Notes VARCHAR(1000), HistoryResultID INTEGER, LastEdit TIMESTAMP, LoggedByUserID INTEGER, InMPDWeeklyUpdate BOOLEAN, IsChallenge BOOLEAN, IsThank BOOLEAN, IsMassMailing BOOLEAN, AutoGenCode VARCHAR(50))");
        stmt.execute("CREATE TABLE HistoryContact (HistoryContactID INTEGER PRIMARY KEY, HistoryID INTEGER, ContactID INTEGER)");
        stmt.close();
        return conn;
    }
}
