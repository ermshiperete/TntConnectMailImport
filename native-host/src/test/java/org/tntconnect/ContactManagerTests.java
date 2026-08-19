package org.tntconnect;

import models.Contact;
import org.tntconnect.ContactManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.sql.*;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class ContactManagerTests {
    @Test
    void findContactByEmailExactMatch(@TempDir Path tempDir) throws Exception {
        Path dbPath = tempDir.resolve("test.mpddb");
        try (Connection conn = createTestDb(dbPath)) {
            Statement stmt = conn.createStatement();
            stmt.execute("INSERT INTO Contact (ContactID, Email1, Email2, Email3) VALUES (1, 'john@example.com', '', '')");
            stmt.close();

            ContactManager manager = new ContactManager(conn);
            Contact contact = manager.findContactByEmail("john@example.com");

            assertNotNull(contact);
            assertEquals(1, contact.getContactId());
            assertEquals("john@example.com", contact.getEmail1());
        }
    }

    @Test
    void findContactByEmailNoMatch(@TempDir Path tempDir) throws Exception {
        Path dbPath = tempDir.resolve("test.mpddb");
        try (Connection conn = createTestDb(dbPath)) {
            Statement stmt = conn.createStatement();
            stmt.execute("INSERT INTO Contact (ContactID, Email1, Email2, Email3) VALUES (1, 'john@example.com', '', '')");
            stmt.close();

            ContactManager manager = new ContactManager(conn);
            Contact contact = manager.findContactByEmail("nonexistent@example.com");

            assertNull(contact);
        }
    }

    @Test
    void findContactByEmailMultipleMatchesThrows(@TempDir Path tempDir) throws Exception {
        Path dbPath = tempDir.resolve("test.mpddb");
        try (Connection conn = createTestDb(dbPath)) {
            Statement stmt = conn.createStatement();
            stmt.execute("INSERT INTO Contact (ContactID, Email1, Email2, Email3) VALUES (1, 'john@example.com', '', '')");
            stmt.execute("INSERT INTO Contact (ContactID, Email2, Email1, Email3) VALUES (2, '', 'john@example.com', '')");
            stmt.close();

            ContactManager manager = new ContactManager(conn);
            assertThrows(SQLException.class, () -> manager.findContactByEmail("john@example.com"));
        }
    }

    private Connection createTestDb(Path path) throws SQLException, ClassNotFoundException {
        Class.forName("org.hsqldb.jdbc.JDBCDriver");
        Connection conn = DriverManager.getConnection("jdbc:hsqldb:file:" + path.toString(), "SA", "");
        Statement stmt = conn.createStatement();
        stmt.execute("CREATE TABLE Contact (ContactID INTEGER PRIMARY KEY, Email1 VARCHAR(255), Email2 VARCHAR(255), Email3 VARCHAR(255), SpouseEmail1 VARCHAR(255), SpouseEmail2 VARCHAR(255), SpouseEmail3 VARCHAR(255), LastEdit TIMESTAMP, LastLetterDate TIMESTAMP)");
        stmt.close();
        return conn;
    }
}
