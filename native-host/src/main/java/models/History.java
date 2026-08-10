package models;

import java.time.LocalDateTime;

public class History {
    private int historyId;
    private int taskTypeId;
    private String description;
    private LocalDateTime historyDate;
    private String notes;
    private int historyResultId;
    private LocalDateTime lastEdit;
    private int loggedByUserId;
    private boolean inMpdWeeklyUpdate;
    private boolean isChallenge;
    private boolean isThank;
    private boolean isMassMailing;
    private String autoGenCode;

    public int getHistoryId() {
        return historyId;
    }

    public void setHistoryId(int historyId) {
        this.historyId = historyId;
    }

    public int getTaskTypeId() {
        return taskTypeId;
    }

    public void setTaskTypeId(int taskTypeId) {
        this.taskTypeId = taskTypeId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getHistoryDate() {
        return historyDate;
    }

    public void setHistoryDate(LocalDateTime historyDate) {
        this.historyDate = historyDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public int getHistoryResultId() {
        return historyResultId;
    }

    public void setHistoryResultId(int historyResultId) {
        this.historyResultId = historyResultId;
    }

    public LocalDateTime getLastEdit() {
        return lastEdit;
    }

    public void setLastEdit(LocalDateTime lastEdit) {
        this.lastEdit = lastEdit;
    }

    public int getLoggedByUserId() {
        return loggedByUserId;
    }

    public void setLoggedByUserId(int loggedByUserId) {
        this.loggedByUserId = loggedByUserId;
    }

    public boolean isInMpdWeeklyUpdate() {
        return inMpdWeeklyUpdate;
    }

    public void setInMpdWeeklyUpdate(boolean inMpdWeeklyUpdate) {
        this.inMpdWeeklyUpdate = inMpdWeeklyUpdate;
    }

    public boolean isChallenge() {
        return isChallenge;
    }

    public void setChallenge(boolean challenge) {
        isChallenge = challenge;
    }

    public boolean isThank() {
        return isThank;
    }

    public void setThank(boolean thank) {
        isThank = thank;
    }

    public boolean isMassMailing() {
        return isMassMailing;
    }

    public void setMassMailing(boolean massMailing) {
        isMassMailing = massMailing;
    }

    public String getAutoGenCode() {
        return autoGenCode;
    }

    public void setAutoGenCode(String autoGenCode) {
        this.autoGenCode = autoGenCode;
    }
}
