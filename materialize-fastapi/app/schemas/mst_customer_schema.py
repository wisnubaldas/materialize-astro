from pydantic import BaseModel, Field


class CustomerBase(BaseModel):
    CustomerCode: str = Field(max_length=20)
    CompanyName: str | None = Field(default=None, max_length=100)
    PICName: str | None = Field(default=None, max_length=50)
    Address1: str | None = Field(default=None, max_length=60)
    Address2: str | None = Field(default=None, max_length=60)
    City: str | None = Field(default=None, max_length=50)
    PostCode: str | None = Field(default=None, max_length=8)
    CountryCode: str | None = Field(default=None, max_length=2)
    MobileNumber: str | None = Field(default=None, max_length=20)
    FaxNumber: str | None = Field(default=None, max_length=20)
    Phonenumber: str | None = Field(default=None, max_length=20)
    EmailAddress: str | None = Field(default=None, max_length=75)
    NPWPNumber: str | None = Field(default=None, max_length=25)
    ContactIdentifier: str | None = Field(default=None, max_length=3)
    ContactNumber: str | None = Field(default=None, max_length=50)
    EmployeeNumber: str | None = Field(default=None, max_length=10)
    flag_faktur: bool | None = False
    Dom_member: bool | None = False
    int_member: bool | None = True
    DateEntry: str | None = Field(default=None, max_length=10)
    TimeEntry: str | None = Field(default=None, max_length=8)
    void: bool | None = False


class CustomerOut(CustomerBase):
    model_config = {"from_attributes": True}
