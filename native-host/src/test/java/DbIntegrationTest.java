package org.tntconnect;

import models.Contact;
import org.tntconnect.ContactManager;
import org.tntconnect.HistoryManager;
import models.ImportRequest;
import models.ImportResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.sql.*;

import static org.junit.jupiter.api.Assertions.*;

public class DbIntegrationTest {
    @Test
    void findContactByEmailWithKnownAddress(@TempDir Path tempDir) throws Exception {
        Path dbPath = tempDir.resolve("integration.mpddb");
        try (Connection conn = createTestDb(dbPath)) {
            Statement stmt = conn.createStatement();
            stmt.execute("INSERT INTO Contact (ContactID, Email1, Email2, Email3) VALUES (1, 'alice@example.com', '', '')");
            stmt.close();

            ContactManager manager = new ContactManager(conn);
            Contact contact = manager.findContactByEmail("alice@example.com");

            assertNotNull(contact);
            assertEquals(1, contact.getContactId());
        }
    }

    @Test
    void createHistoryAndVerifyInDb(@TempDir Path tempDir) throws Exception {
        Path dbPath = tempDir.resolve("integration.mpddb");
        try (Connection conn = createTestDb(dbPath)) {
            Statement stmt = conn.createStatement();
            stmt.execute("INSERT INTO Contact (ContactID, Email1) VALUES (1, 'bob@example.com')");
            stmt.close();

            HistoryManager manager = new HistoryManager(conn);
            ImportRequest request = new ImportRequest();
            request.setContactEmail("bob@example.com");
            request.setSubject("Meeting");
            request.setBody("Notes from meeting");
            request.setDate("2024-06-01T14:00:00.000Z");
            request.setDirection("sent");

            Contact contact = new Contact();
            contact.setContactId(1);
            contact.setEmail1("bob@example.com");

            ImportResponse response = manager.createHistory(request, contact);

            assertTrue(response.isSuccess());
            assertNotNull(response.getHistoryId());

            Statement checkStmt = conn.createStatement();
            ResultSet rs = checkStmt.executeQuery("SELECT * FROM History WHERE HistoryID = " + response.getHistoryId());
            assertTrue(rs.next());
            assertEquals("Meeting", rs.getString("Description"));
            assertEquals("Notes from meeting", rs.getString("Notes"));
            assertEquals(1, rs.getInt("HistoryResultID"));
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
