package org.tntconnect;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

public class TntDatabase {
    private final Connection connection;

    public TntDatabase(Connection connection) {
        this.connection = connection;
    }

    public void initialize() throws SQLException {
        Statement stmt = connection.createStatement();
        stmt.execute("CREATE TABLE IF NOT EXISTS Contact (ContactID INTEGER PRIMARY KEY, Email1 TEXT, Email2 TEXT, Email3 TEXT, SpouseEmail1 TEXT, SpouseEmail2 TEXT, SpouseEmail3 TEXT, LastEdit TIMESTAMP, LastLetterDate TIMESTAMP)");
        stmt.execute("CREATE TABLE IF NOT EXISTS History (HistoryID INTEGER PRIMARY KEY, TaskTypeID INTEGER, Description TEXT, HistoryDate TIMESTAMP, Notes TEXT, HistoryResultID INTEGER, LastEdit TIMESTAMP, LoggedByUserID INTEGER, InMPDWeeklyUpdate BOOLEAN, IsChallenge BOOLEAN, IsThank BOOLEAN, IsMassMailing BOOLEAN, AutoGenCode TEXT)");
        stmt.execute("CREATE TABLE IF NOT EXISTS HistoryContact (HistoryContactID INTEGER PRIMARY KEY, HistoryID INTEGER, ContactID INTEGER)");
        stmt.execute("CREATE TABLE IF NOT EXISTS TaskType (TaskTypeID INTEGER PRIMARY KEY, TaskTypeName TEXT)");
        stmt.close();
    }
}
