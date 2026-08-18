package org.tntconnect;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import models.Contact;

public class ContactManager {
    private final Connection connection;

    public ContactManager(Connection connection) {
        this.connection = connection;
    }

    public Contact findContactByEmail(String email) throws SQLException {
        String sql = "SELECT ContactID, Email1, Email2, Email3, SpouseEmail1, SpouseEmail2, SpouseEmail3, LastEdit, LastLetter FROM Contact WHERE ";
        String[] fields = {"Email1", "Email2", "Email3", "SpouseEmail1", "SpouseEmail2", "SpouseEmail3"};
        List<String> conditions = new ArrayList<>();
        for (String field : fields) {
            conditions.add(field + " = ?");
        }
        sql += String.join(" OR ", conditions);

        PreparedStatement stmt = connection.prepareStatement(sql);
        for (int i = 0; i < fields.length; i++) {
            stmt.setString(i + 1, email);
        }

        ResultSet rs = stmt.executeQuery();
        List<Contact> matches = new ArrayList<>();
        while (rs.next()) {
            Contact contact = new Contact();
            contact.setContactId(rs.getInt("ContactID"));
            contact.setEmail1(rs.getString("Email1"));
            contact.setEmail2(rs.getString("Email2"));
            contact.setEmail3(rs.getString("Email3"));
            contact.setSpouseEmail1(rs.getString("SpouseEmail1"));
            contact.setSpouseEmail2(rs.getString("SpouseEmail2"));
            contact.setSpouseEmail3(rs.getString("SpouseEmail3"));
            java.sql.Timestamp lastEdit = rs.getTimestamp("LastEdit");
            if (lastEdit != null) {
                contact.setLastEdit(lastEdit.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime());
            }
            java.sql.Timestamp lastLetter = rs.getTimestamp("LastLetter");
            if (lastLetter != null) {
                contact.setLastLetterDate(lastLetter.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime());
            }
            matches.add(contact);
        }
        rs.close();
        stmt.close();

        if (matches.isEmpty()) {
            return null;
        }
        if (matches.size() > 1) {
            throw new SQLException("Multiple contacts found for email: " + email);
        }
        return matches.get(0);
    }
}
