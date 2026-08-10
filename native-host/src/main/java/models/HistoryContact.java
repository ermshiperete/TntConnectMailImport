package models;

public class HistoryContact {
    private int historyContactId;
    private int historyId;
    private int contactId;

    public int getHistoryContactId() {
        return historyContactId;
    }

    public void setHistoryContactId(int historyContactId) {
        this.historyContactId = historyContactId;
    }

    public int getHistoryId() {
        return historyId;
    }

    public void setHistoryId(int historyId) {
        this.historyId = historyId;
    }

    public int getContactId() {
        return contactId;
    }

    public void setContactId(int contactId) {
        this.contactId = contactId;
    }
}
