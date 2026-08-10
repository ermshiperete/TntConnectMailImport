package models;

import java.time.LocalDateTime;

public class Contact {
    private int contactId;
    private String email1;
    private String email2;
    private String email3;
    private String spouseEmail1;
    private String spouseEmail2;
    private String spouseEmail3;
    private LocalDateTime lastEdit;
    private LocalDateTime lastLetterDate;

    public int getContactId() {
        return contactId;
    }

    public void setContactId(int contactId) {
        this.contactId = contactId;
    }

    public String getEmail1() {
        return email1;
    }

    public void setEmail1(String email1) {
        this.email1 = email1;
    }

    public String getEmail2() {
        return email2;
    }

    public void setEmail2(String email2) {
        this.email2 = email2;
    }

    public String getEmail3() {
        return email3;
    }

    public void setEmail3(String email3) {
        this.email3 = email3;
    }

    public String getSpouseEmail1() {
        return spouseEmail1;
    }

    public void setSpouseEmail1(String spouseEmail1) {
        this.spouseEmail1 = spouseEmail1;
    }

    public String getSpouseEmail2() {
        return spouseEmail2;
    }

    public void setSpouseEmail2(String spouseEmail2) {
        this.spouseEmail2 = spouseEmail2;
    }

    public String getSpouseEmail3() {
        return spouseEmail3;
    }

    public void setSpouseEmail3(String spouseEmail3) {
        this.spouseEmail3 = spouseEmail3;
    }

    public LocalDateTime getLastEdit() {
        return lastEdit;
    }

    public void setLastEdit(LocalDateTime lastEdit) {
        this.lastEdit = lastEdit;
    }

    public LocalDateTime getLastLetterDate() {
        return lastLetterDate;
    }

    public void setLastLetterDate(LocalDateTime lastLetterDate) {
        this.lastLetterDate = lastLetterDate;
    }
}
