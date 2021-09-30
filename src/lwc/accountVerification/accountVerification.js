import { LightningElement, api, track, wire } from "lwc";
import getPicklistValues from "@salesforce/apex/LwcUtils.getPicklistValues";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { loadStyle } from "lightning/platformResourceLoader";
import styles from "@salesforce/resourceUrl/AccountVerificationLwc";
import invokeEPWFPaymentservice from "@salesforce/apexContinuation/AccountVerificationExtensionLEX.invokeEPWFPaymentservice";
import getCallIntents from "@salesforce/apex/AccountVerificationExtensionLEX.getCallIntents";
import getContacts from "@salesforce/apex/AccountVerificationExtension.initContactsForLightning";
import CRIS_Message_Text from "@salesforce/label/c.CRIS_Message_Text";
import Minnesota_CRISMessage_Text from "@salesforce/label/c.Minnesota_CRISMessage_Text";
import ENS_Message_Text from "@salesforce/label/c.ENS_Message_Text";
import Minnesota_ENSMessage_Text from "@salesforce/label/c.Minnesota_ENSMessage_Text";
import queryDatabase from "@salesforce/apex/LwcUtils.queryDatabase";
import PPP_SpecialHandlingMsg from "@salesforce/label/c.pppSpecialHandlingMessage";
import getMycenturylinkID from "@salesforce/apex/AccountVerificationExtensionLEX.populateMyAccountId";
import getCustomerLocalTime from "@salesforce/apex/AccountVerificationExtensionLEX.getCustomerLocalTime";

const convertSObjectsToComboboxEntries = (arr, labelKey, valueKey) => {
  return arr.map(sObj => ({ label: sObj[labelKey], value: sObj[valueKey] }));
};

class Waiter {
  actionsTaken = 0;
  constructor(asyncActionCount, onAsyncActionsFinished, delay = 0) {
    this.asyncActionCount = asyncActionCount;
    this.onAsyncActionsFinished = onAsyncActionsFinished;
    this.delay = delay;
  }

  done() {
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    setTimeout(() => {
      this.actionsTaken++;
      if (this.actionsTaken !== this.asyncActionCount) return;
      this.onAsyncActionsFinished();
    }, this.delay);
  }
}

export default class AccountVerification extends LightningElement {
  ONE_TIME_AUTHORIZATION = "One Time Authorization";
  FULLY_RENDERED_DELAY = 500;
  ASYNC_ACTION_COUNT = 4;
  ENS_CPNI_CHOICES = [
    "Permanent/Yes",
    "Permanent/No",
    "Permanent/No (Don't Ask)"
  ];
  CRIS_CPNI_CHOICES = [
    "Permanent/Yes",
    "Permanent/No",
    "One Time/Yes",
    "One Time/No"
  ]; //AddLine
  @api recordId;
  @api isVerified;
  @api calloutData;
  @api callData;
  @track callIntents;
  @track authorizedContacts = [
    { label: this.ONE_TIME_AUTHORIZATION, value: this.ONE_TIME_AUTHORIZATION }
  ];
  @track url = "https://eam.centurylink.com/eam/retrieveAuthCode.do?accountNo=";
  @track isEnsAcct;
  @track isPPPAcct;
  @track isCrisAcct;
  @track authorizedContact = this.authorizedContacts[0].value;
  @track serviceAddresses;
  @track cpni = null;
  @track callIntent;
  @track accErrormsg = "";
  @track isBln = false;
  @track AddressCount = 0;
  @track lastPaymentMethod;
  @track isCenturylinkEmployee;
  @track servAddrs = [];
  @track pppaccmsg = "";
  @track prepaidAccInfo = {};
  hasFormDataLoaded = false;
  promoCols = [
    { label: "Key Code", fieldName: "Format_KeyCode__c" },
    { label: "Website", fieldName: "Promotions_Document__c", type: "url" },
    { label: "Offer", fieldName: "Offer__c" },
    { label: "Main Telephone Number", fieldName: "Main_TFN__c" },
    { label: "Spanish Telephone Number", fieldName: "Spanish_TFN__c" },
    { label: "Offer Start Date", fieldName: "Offer_Start_Date__c" },
    { label: "Offer End Date", fieldName: "Offer_End_Date__c" }
  ];
  @wire(getCallIntents)
  processCallIntents({ error, data }) {
    if (data) {
      const CALL_INTENT = "Call_Intent__c";
      this.callIntents = convertSObjectsToComboboxEntries(
        JSON.parse(data),
        CALL_INTENT,
        CALL_INTENT
      );
      this.waiter.done();
    } else if (error) {
      this.waiter.done();
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message: error,
          variant: "error"
        })
      );
    }
  }

  waiter = new Waiter(
    this.ASYNC_ACTION_COUNT,
    () => {
      this.dispatchEvent(
        new CustomEvent("dataloaded", {
          bubbles: true
        })
      );
    },
    this.FULLY_RENDERED_DELAY
  );

  isValidPicklistEntry(picklistEntry) {
    if (this.isEnsAcct)
      return this.ENS_CPNI_CHOICES.indexOf(picklistEntry.value) > -1;
    return this.CRIS_CPNI_CHOICES.indexOf(picklistEntry.value) > -1;
  }

  checkFormValidity() {
    const formStatus = {
      isValid: true,
      addError: function(message) {
        this.errorMessage = message;
      }
    };
    if (this.isOneTimeAuth && !this.callingParty && this.isEnsAcct) {
      formStatus.isValid = false;
      formStatus.addError({
        title: "Error",
        message: "Calling Party is Required!",
        variant: "error"
      });
    } else if (!this.cpni) {
      formStatus.isValid = false;
      formStatus.addError({
        title: "Error",
        message: "CPNI is Required!",
        variant: "error"
      });
    } else if (!this.callIntent) {
      formStatus.isValid = false;
      formStatus.addError({
        title: "Error",
        message: "Call Intent is Required!",
        variant: "error"
      });
    }
    return formStatus;
  }

  @api get formData() {
    return {
      callIntent: this.callIntent,
      authorizedContactName: this.authorizedContactName,
      authorizedContactId: this.authorizedContactId,
      cpni: this.cpni,
      formStatus: this.checkFormValidity()
    };
  }

  get shouldShowIvrSelection() {
    return !this.isVerified;
  }

  get isOneTimeAuth() {
    return this.authorizedContact === this.ONE_TIME_AUTHORIZATION;
  }

  get isCodeRetrievable() {
    return (
      this.calloutData &&
      this.calloutData.pin &&
      this.calloutData.pin != " " &&
      this.calloutData.pin != "Info is currently unavailable" &&
      this.AccountNumber
    );
  }

  get authorizedContactId() {
    if (!this.authorizedContacts) return null;
    if (this.isOneTimeAuth) return this.authorizedContacts[0].value;
    return this.authorizedContacts.filter(
      authorizedContact => authorizedContact.value === this.authorizedContact
    )[0].value;
  }

  get authorizedContactName() {
    if (this.isOneTimeAuth) return this.callingParty;
    return this.authorizedContacts.filter(
      authorizedContact => authorizedContact.value === this.authorizedContact
    )[0].label;
  }

  connectedCallback() {
    loadStyle(this, styles);
    queryDatabase({
      query:
        "SELECT Name, Billing_Source__c, Accountnumber, No_of_MN_Service_Address__c, MN_Service_Address_Count__c, Account_Status__c, isEmployeeDiscountFidAvailable__c,CenturyLink_Employee__c ,Customer_Tag_Segment__c, Additional_Customer_Tag__c, Has_Fixed_Wire__c, Legacy_Stack__c, isESHOPAccount__c, Service_Addresses__c, Service_Address_Count__c, Primary_Service_Address__c, Recurring_Payment_Method__c, Current_Bill_Due_Date__c, CPNI__c, Credit_Decision__c " +
        "FROM Account " +
        "WHERE Id = '" +
        this.recordId +
        "'"
    }).then(resp1 => {
      //'Account.Billing_Source__c', 'Account.Customer_Tag_Segment__c','Account.Legacy_Stack__c','Account.isESHOPAccount__c','Account.Service_Addresses__c','Account.Service_Address_Count__c', 'Account.Primary_Service_Address__c','Account.Recurring_Payment_Method__c','Account.Current_Bill_Due_Date__c','Account.Credit_Decision__c'
      this.Service_Address_NameList = "";
      this.Account = resp1[0];
      this.isESHOPAccount = this.Account.isESHOPAccount__c;
      this.FixedWireless = this.Account.Has_Fixed_Wire__c;
	  getMycenturylinkID({ recordId: this.recordId })	
      .then(resp =>{	
        if(this.Account && this.Account.Billing_Source__c === "PPP"){	
          console.log('Prepaid info!');	
          console.log(JSON.parse(resp));	
          this.prepaidAccInfo = JSON.parse(resp);	
        }	
        	
      }).catch(err =>{	
        console.log('Prepaid error: '+err);	
      })
      if (
        (this.Account.CenturyLink_Employee__c &&
          this.Account.Billing_Source__c === "Ensemble") ||
        (this.Account.isEmployeeDiscountFidAvailable__c &&
          this.Account.Billing_Source__c === "CRIS")
      ) {
        this.isCenturylinkEmployee = true;
      }
      this.newAcctLoad(this.Account);
    });
    getContacts({ AcctID: this.recordId })
      .then(resp => {
        this.waiter.done();
        this.authorizedContacts = [
          ...convertSObjectsToComboboxEntries(resp, "Name", "Id"),
          ...this.authorizedContacts
        ];
        this.authorizedContact = this.authorizedContacts[0].value;
      })
      .catch(error => {
        this.waiter.done();
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error",
            message: error.body.message,
            variant: "error"
          })
        );
      });

    invokeEPWFPaymentservice({ accId: this.recordId }).then(
      ({ lastPaymentMethod }) => {
        if (!lastPaymentMethod) return;
        this.lastPaymentMethod = lastPaymentMethod;
      }
    );
	
	getCustomerLocalTime({ accId: this.recordId});

  }
  newAcctLoad(accRecord) {
    if (this.hasFormDataLoaded) return;
    this.hasFormDataLoaded = true;
    const recordFields = accRecord;
    this.waiter.done();
    //const recordFields = e.detail.records[this.recordId].fields;
    this.isEnsAcct =
      recordFields.Billing_Source__c === "Ensemble" ? true : false;
    this.isPPPAcct = recordFields.Billing_Source__c === "PPP" ? true : false;
    this.isCrisAcct = recordFields.Billing_Source__c === "CRIS" ? true : false;

    this.AccountNumber = recordFields.AccountNumber;
    if (this.isPPPAcct) {
      if (this.callIntents) {
        for (var i = 0; i < this.callIntents.length; i++) {
          console.log(
            "Call internt oprtion " + JSON.stringify(this.callIntents[i])
          );
          if (
            this.callIntents[i].value ===
              "DIRECTV (Billing/Repair/Disconnect)" ||
            this.callIntents[i].value === "Payment Arrangement"
          ) {
            this.callIntents.splice(i, 1);
          }
        }
      }

      this.pppaccmsg = PPP_SpecialHandlingMsg;
      this.dispatchEvent(new CustomEvent("pppmsg", { detail: this.pppaccmsg }));
    }

    if (
      recordFields.Account_Status__c &&
      (recordFields.Account_Status__c === "Final" ||
        recordFields.Account_Status__c === "Closed" ||
        recordFields.Account_Status__c === "Canceled" ||
        recordFields.Account_Status__c === "Write Off : W-OFF")
    ) {
      this.AddressCount = recordFields.No_of_MN_Service_Address__c;
    } else {
      this.AddressCount = recordFields.MN_Service_Address_Count__c;
    }
    if (recordFields.CenturyLink_Employee__c === true) {
      if (
        recordFields.Billing_Source__c === "Ensemble" &&
        this.AddressCount <= 0
      ) {
        this.accErrormsg = ENS_Message_Text;
        this.dispatchEvent(
          new CustomEvent("errormsg", { detail: this.accErrormsg })
        );
      } else if (
        recordFields.Billing_Source__c === "Ensemble" &&
        this.AddressCount > 0
      ) {
        this.accErrormsg = Minnesota_ENSMessage_Text;
        this.dispatchEvent(
          new CustomEvent("errormsg", { detail: this.accErrormsg })
        );
      }
    }

    if (this.isCenturylinkEmployee === true) {
      if (recordFields.Billing_Source__c === "CRIS" && this.AddressCount <= 0) {
        this.accErrormsg = CRIS_Message_Text;
        this.dispatchEvent(
          new CustomEvent("errormsg", { detail: this.accErrormsg })
        );
      } else if (
        recordFields.Billing_Source__c === "CRIS" &&
        this.AddressCount > 0
      ) {
        this.accErrormsg = Minnesota_CRISMessage_Text;
        this.dispatchEvent(
          new CustomEvent("errormsg", { detail: this.accErrormsg })
        );
      }
    }

    const acctCpni = recordFields.CPNI__c;
    getPicklistValues({ sObjectName: "Account", fieldName: "CPNI__c" })
      .then(result => {
        this.waiter.done();
        let defaultCpni;
        this.cpniOptions = JSON.parse(result).filter(picklistEntry => {
          if (picklistEntry.value === acctCpni)
            defaultCpni = picklistEntry.value;
          return this.isValidPicklistEntry(picklistEntry);
        });
        this.cpni = defaultCpni || this.cpniOptions[0].value;
      })
      .catch(error => {
        this.waiter.done();
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error",
            message: error.body.message,
            variant: "error"
          })
        );
      });
    if (!this.AccountNumber) return;
    const numericalAccNum = this.AccountNumber.replace(/\D/g, "");
    this.url += numericalAccNum;
  }

  handleAcctLoad(e) {
    if (this.hasFormDataLoaded) return;
    this.hasFormDataLoaded = true;
    this.waiter.done();
    const recordFields = e.detail.records[this.recordId].fields;
    this.isEnsAcct = recordFields.Billing_Source__c.value === "Ensemble";
    this.isPPPAcct = recordFields.Billing_Source__c.value === "PPP";
    this.isCrisAcct = recordFields.Billing_Source__c.value === "CRIS";

    this.AccountNumber = recordFields.AccountNumber
      ? recordFields.AccountNumber.value
      : null;

    if (this.isPPPAcct) {
      if (this.callIntents) {
        for (var i = 0; i < this.callIntents.length; i++) {
          console.log(
            "Call internt oprtion " + JSON.stringify(this.callIntents[i])
          );
          if (
            this.callIntents[i].value ===
              "DIRECTV (Billing/Repair/Disconnect)" ||
            this.callIntents[i].value === "Payment Arrangement"
          ) {
            this.callIntents.splice(i, 1);
          }
        }
      }

      this.pppaccmsg = PPP_SpecialHandlingMsg;
      this.dispatchEvent(new CustomEvent("pppmsg", { detail: this.pppaccmsg }));
    }

    if (
      recordFields.Account_Status__c.value === "Final" ||
      recordFields.Account_Status__c.value === "Closed" ||
      recordFields.Account_Status__c.value === "Canceled" ||
      recordFields.Account_Status__c.value === "Write Off : W-OFF"
    ) {
      this.AddressCount = recordFields.No_of_MN_Service_Address__c;
    } else {
      this.AddressCount = recordFields.MN_Service_Address_Count__c;
    }
    if (recordFields.CenturyLink_Employee__c.value === true) {
      if (
        recordFields.Billing_Source__c.value === "Ensemble" &&
        this.AddressCount.value <= 0
      ) {
        this.accErrormsg = ENS_Message_Text;
        this.dispatchEvent(
          new CustomEvent("errormsg", { detail: this.accErrormsg })
        );
      } else if (
        recordFields.Billing_Source__c.value === "Ensemble" &&
        this.AddressCount.value > 0
      ) {
        this.accErrormsg = Minnesota_ENSMessage_Text;
        this.dispatchEvent(
          new CustomEvent("errormsg", { detail: this.accErrormsg })
        );
      }
    }
    if (this.isCenturylinkEmployee === true) {
      if (
        recordFields.Billing_Source__c.value === "CRIS" &&
        this.AddressCount.value <= 0
      ) {
        this.accErrormsg = CRIS_Message_Text;
        this.dispatchEvent(
          new CustomEvent("errormsg", { detail: this.accErrormsg })
        );
      } else if (
        recordFields.Billing_Source__c.value === "CRIS" &&
        this.AddressCount.value > 0
      ) {
        this.accErrormsg = Minnesota_CRISMessage_Text;
        this.dispatchEvent(
          new CustomEvent("errormsg", { detail: this.accErrormsg })
        );
      }
    }

    const { CPNI__c: { value: acctCpni } = {} } = recordFields;
    getPicklistValues({ sObjectName: "Account", fieldName: "CPNI__c" })
      .then(result => {
        this.waiter.done();
        let defaultCpni;
        this.cpniOptions = JSON.parse(result).filter(picklistEntry => {
          if (picklistEntry.value === acctCpni)
            defaultCpni = picklistEntry.value;
          return this.isValidPicklistEntry(picklistEntry);
        });
        this.cpni = defaultCpni || this.cpniOptions[0].value;
      })
      .catch(error => {
        this.waiter.done();
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error",
            message: error.body.message,
            variant: "error"
          })
        );
      });
    if (!this.AccountNumber) return;
    const numericalAccNum = this.AccountNumber.replace(/\D/g, "");
    this.url += numericalAccNum;
  }

  handleChange(e) {
    if (!e || !e.target) return;
    const targetName = e.target.name || e.target.fieldName;
    if (!targetName) return;
    this[targetName] = e.target.value;
  }

  getServAddrs() {
    queryDatabase({
      query:
        "SELECT Name, Service_Street__c, Service_City__c, Service_State__c, Service_Postal_Code__c, Service_Street_2__c, Address_Source__c, Service_Street_Type__c, Service_Street_Prefix__c, Service_Street_Number__c, " +
        "Service_Street_Name__c, Legacy_Stack__c, Service_Address_Unit__c,IsSpeedsDownGraded__c,Service_Address_Structure__c,Service_Address_Level__c, Service_Address_Source_Id__c, CALA__c, Tax_Area_Code__c, Service_Address_Unit_Type__c, Service_Address_Level_Type__c, " +
        "Service_Address_Structure_Type__c,Billing_Account__r.AccountNumber__c, Address_Sources__c,Wire_Center__c,IsDvarAddress__c ,Active__c ,Service_Street_Suffix__c,DVARCCVServiceAddress__c,Submarket__c,Fixed_Wire_Speeds__c " +
        "FROM Service_Address__c " +
        "WHERE Billing_Account__c = '" +
        this.recordId +
        "' AND Active__c = true LIMIT 50"
    })
      .then(resp => {
        this.servAddrs = resp || [];
      })
      .catch(e => {
        console.log(
          `Error Occured in accountVerification ServAddrs DB Query:${JSON.stringify(
            e
          )}`
        );
      });
  }

  get servAddrsList() {
    this.getServAddrs();
    const { servAddrs } = this;
    let list = "";
    for (let i = 0; i < servAddrs.length; i++) {
      const servAddr = servAddrs[i];
      if (
        servAddr.Legacy_Stack__c === "Legacy Qwest" ||
        (servAddr.Legacy_Stack__c === "Legacy CenturyLink" &&
          servAddr.Active__c)
      ) {
        list += servAddr.Name;
        if (i !== servAddrs.length - 1) {
          list += "; ";
        }
      }
    }
    return list;
  }
}
