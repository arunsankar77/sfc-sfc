/* eslint-disable no-console */
import { CurrentPageReference } from "lightning/navigation";
import {
  fireEvent,
  registerTabListener,
  unregisterAllListeners,
  unregisterAllTabListeners,
  fireTabEvent,
  getMyParentTabId
} from "c/pubsub";
import { LightningElement, api, track, wire } from "lwc";
import USER_ID from '@salesforce/user/Id';
import isUserRepairPilot from "@salesforce/apex/RepairNewCaseLex.isUserRepairPilot";
import isUserRepairPilotwithCaseflow from "@salesforce/apex/RepairNewCaseLex.isUserRepairPilotwithCaseflow";																											
import { getRecord, getFieldValue } from "lightning/uiRecordApi";
import getCustomPermission from "@salesforce/apex/LwcUtils.getCustomPermission";
import ConsoleApiBridge from "c/consoleApiBridge";
import StatePersister from "c/statePersister";
import dvarCcvContinuation from "@salesforce/apexContinuation/AccountVerificationExtension.lightningInvokeDVARCVVRequest";
import eShopWarningLabel from "@salesforce/label/c.EshopAccountHandling";
import defaultSerAddrLabel from "@salesforce/label/c.defaultServiceAddressMessage";
import cpniLegalScript from "@salesforce/label/c.CPNI_Legal_Script";
import getServiceAddresses from "@salesforce/apex/AccountVerificationExtension.lightningGetServiceAddressDetails";
import queueDvarIa from "@salesforce/apex/AccountVerificationExtensionLEX.CallDVAR_IA";
import getSecureWifiIndicator from "@salesforce/apex/AccountVerificationExtensionLEX.callOdataForSecuredWifiIndicator";
import ACCOUNT_STATUS_FIELD from "@salesforce/schema/Account.Account_Status__c";
import ACCOUNT_BILL_SOURCE_FIELD from "@salesforce/schema/Account.Billing_Source__c";
import ACCOUNT_EMAIL_FIELD from "@salesforce/schema/Account.PersonEmail";
import ACCOUNT_BILL_METHOD_FIELD from "@salesforce/schema/Account.Billing_Method__c";
import CPNI_FIELD from "@salesforce/schema/Account.CPNI__c";
import saveTask from "@salesforce/apex/AccountVerificationExtension.saveVerificationTask";
//import ValidateJSRecords from "@salesforce/apex/SmsSurvey.ValidateJSRecords";																			 
import { updateRecord } from "lightning/uiRecordApi";
import getMatchingPromos from "@salesforce/apex/AccountVerificationExtension.lightningGetMatchingPromos";
import invokeRepairTktCallout from "@salesforce/apexContinuation/AccountVerificationExtensionLEX.invokeRepairTktSummaryRequest";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import queryDatabase from "@salesforce/apex/LwcUtils.queryDatabase";
import queryCacheableDatabase from "@salesforce/apex/LwcUtils.queryCacheableDatabase";
import getDiscounts from "@salesforce/apex/LwcUtils.getDiscounts";
import GEOESAddressVal from "@salesforce/label/c.Address_Validation_GEOES";
import geoesContinuation from "@salesforce/apexContinuation/AddressValidation.beginCalloutForSearch";
//Comments: Added for User story CSICC - 45251
import MessageText from "@salesforce/label/c.Cris_Embargo_MessageText";
//Comments: Added for User story CSICC - 44851
import ConvertedMessageText from "@salesforce/label/c.C2E_Converted_NewAC_MessageText";
import CRISMessageDisplayDuration from "@salesforce/label/c.C2E_Converted_NewAC_Message_Duration";
import ACCOUNT_CenturyLink_Employee_FIELD from "@salesforce/schema/Account.CenturyLink_Employee__c";
import CHIA_Address_Count_FIELD from "@salesforce/schema/Account.CHIA_Address_Count__c";
import ACCOUNT_MN_Service_Address_Count_FIELD from "@salesforce/schema/Account.MN_Service_Address_Count__c";
import ACCOUNT_No_Of_MN_Service_Address_Count_FIELD from "@salesforce/schema/Account.No_of_MN_Service_Address__c";
import ACCOUNT_Account_Number_FIELD from "@salesforce/schema/Account.AccountNumber__c";
import ACCOUNT_ISEmployeeDiscountFidAvailable_FIELD from "@salesforce/schema/Account.isEmployeeDiscountFidAvailable__c";
import getFixedWireLessMsg from "@salesforce/apex/AccountVerificationExtension.LightningGetFixedWireLessMsg";
import MultipleClicksOnButtonWarning from "@salesforce/label/c.MultipleClicksOnButtonWarning";
import ACCOUNT_CUSTOMER_FULLYAUTHENTICATED from "@salesforce/schema/Account.Enhanced_Authentication_Verified__c";
import getMycenturylinkID from "@salesforce/apex/AccountVerificationExtensionLEX.populateMyAccountId";
import createNewCase from "@salesforce/apex/RepairNewCaseLex.createNewCase";
import checkChatPermission from "@salesforce/apex/LwcUtils.returnChatEnabled";
import getAccountErrorMessages from "@salesforce/apex/AccountVerificationExtension.returnAccObjErrorMessages";
/**
 * Special Handling Labels - No dynamic label generation is ONLY supported in VF. Apex and LWC cannot.*/
import SpecialHandlingAddress_VMDU_LCTL from "@salesforce/label/c.SpecialHandlingAddress_VMDU_LCTL";
import SpecialHandlingAddress_BHSI_LQ from "@salesforce/label/c.SpecialHandlingAddress_BHSI_LQ";
import SpecialHandlingAddress_BHSI_LCTL from "@salesforce/label/c.SpecialHandlingAddress_BHSI_LCTL";
import SpecialHandling_CTLSimple_LQ from "@salesforce/label/c.SpecialHandling_CTLSimple_LQ";
import SpecialHandling_CTLON_LQ from "@salesforce/label/c.SpecialHandling_CTLON_LQ";
import SpecialHandling_CTLON_LCTL from "@salesforce/label/c.SpecialHandling_CTLON_LCTL";
import downgradeMsg from "@salesforce/label/c.DownGradeAlert";
import CHIAAddressWarningMessage from "@salesforce/label/c.CHIA_Address_Warning_Message";
import getCurrentCaseDetails from "@salesforce/apex/CaseflowController.getCurrentCaseDetails";
//Comments: Added for User story CSICC - 407
import ENSMessageText from "@salesforce/label/c.ENS_Embargo_MessageText";
const SPECIAL_HANDLING_LABELS = {
  SpecialHandling_CTLON_LCTL,
  SpecialHandling_CTLON_LQ,
  SpecialHandling_CTLSimple_LQ,
  SpecialHandlingAddress_BHSI_LCTL,
  SpecialHandlingAddress_BHSI_LQ,
  SpecialHandlingAddress_VMDU_LCTL
};
/**
 * End Special Handling Labels
 */

const CONFIRMATION_REQ_MSG =
  "Confirmation of Communication Preferences Required";

export default class AccountEntranceHandler extends LightningElement {
  @api recordId;
  @track isFromModel = true;
  @track hasVerifiedAcct = false;
  @track calloutData = {};
  @track shouldConfirmCommPrefs;
  @track shouldForceConfirmation = false;
  @track shouldForceDiscountHandling = false;
  @track acct = {};
  @track showFixedWirelessMessage;
  @track FixedWirelessMessage;
  @track errorMsg1 = "";
  @track isBln = false;
  @track pppMsg1 = "";
  @track ispppBln = false;
  @track isDisabled = false;
  //Comments: Added for User story CSICC - 45251
  @track OnCris_Embargo = false;
  MultipleClicksWarning = MultipleClicksOnButtonWarning;
  @track openmodel = false;
  @track isSubtab = false;
  @track isCustomerFullyAuthenticated = false;
  //@track canViewNewNotes = false;
  @track ppp_Billling = false;
  @track isStillOnAccount = true;
  shouldShowModal = true;
  //Comments: CSICC - 44851 : CRIS to Eshop Account
  @track cris_Converted = false;
  @track verificationStartTime ;
  @track verificationEndTime ;	
  //Comments: Added for User story CSICC - 407
  @track isENSAccount = false;
  label = {
    downgradeMsg,
	//Comments: Added for User story CSICC - 45251
    MessageText,
	//Comments: Added for User story CSICC - 44851
    ConvertedMessageText,
	//Comments: Added for User story CSICC - 407
    ENSMessageText
  };

  AUTHENTICATED_VALUES = "SSN;";
	hasDoneOdataCalls = false;
  CALL_DATA_KEY = "callData";
  ALREADY_VERIFIED_KEY = "hasVerifiedAcct";
  COMM_PREFS_BUTTON_LABEL = "Confirm";
  COMM_PREFS_MODAL_INDEX = 1;
  VERIFIED_BUTTON_LABEL = "Verified";
  GENERIC_ERROR_MESSAGE = "Info is currently unavailable";
  QUEUED_JOB_FINISHED_INDICATOR = "Completed";
  COMM_PREFS_CONFIRMATION_MODE = "commPrefsConfirmation";
  MULTIPLE_MATCHING_ACCOUNTS_FAKE_ID = "MultipleMatchAc";

  statePersister;
  ctiPersister;
  verifyPersister;
  discountErrMsgs = [];
  callData = {};
  callDataIndex = -1;
  pgMsgQueue = [];
  pgMsgCmp = null;
  hasRendered = false;

  @wire(getRecord, {
    recordId: "$recordId",
    fields: [
      ACCOUNT_STATUS_FIELD,
      ACCOUNT_BILL_SOURCE_FIELD,
      CPNI_FIELD,
      ACCOUNT_BILL_METHOD_FIELD,
      ACCOUNT_CenturyLink_Employee_FIELD,
      ACCOUNT_MN_Service_Address_Count_FIELD,
      ACCOUNT_No_Of_MN_Service_Address_Count_FIELD,
      ACCOUNT_ISEmployeeDiscountFidAvailable_FIELD,
      ACCOUNT_EMAIL_FIELD,
      ACCOUNT_CUSTOMER_FULLYAUTHENTICATED,
      CHIA_Address_Count_FIELD,
      ACCOUNT_Account_Number_FIELD
    ]
  })
  processAcctDetails({ error, data }) {
    if (error) {
      console.log("messed up " + JSON.stringify(error));
    } else if (data) {
      this.acct = data;
      const billingMethod = getFieldValue(this.acct, ACCOUNT_BILL_METHOD_FIELD);
      const email = getFieldValue(this.acct, ACCOUNT_EMAIL_FIELD);
      const CHIAAddressCount = getFieldValue(
        this.acct,
        CHIA_Address_Count_FIELD
      );
      console.log("this.acct.CHIA_Address_Count__c " + CHIAAddressCount);
      if (CHIAAddressCount > 0) {
        this.addPgMsg({
          text: CHIAAddressWarningMessage,
          severity: "warning",
          utilityIconName: "warning"
        });
      }
      this.isCustomerFullyAuthenticated = getFieldValue(
        this.acct,
        ACCOUNT_CUSTOMER_FULLYAUTHENTICATED
      );
      if (billingMethod === "Paperless" && !email) {
        this.discountErrMsgs = [
          ...this.discountErrMsgs,
          "Paperless billing has been chosen. Please add an email address."
        ];
      }
		if(this.hasDoneOdataCalls)return;
      this.hasDoneOdataCalls = true;
      getDiscounts({
        id: this.recordId,
        billingMethod: billingMethod,
        email: email
      }).then(errMsgs => {
        this.discountErrMsgs = [...this.discountErrMsgs, ...errMsgs];
      });
      queryCacheableDatabase({
        query:
          "SELECT Id, outageEndTime__c FROM PostpaidOutageDetails__x " +
          "WHERE accountNumber__c = '" +
          getFieldValue(this.acct, ACCOUNT_Account_Number_FIELD) +
          "'"
      });
    }
  }

  // @wire(getCustomPermission, { permissionName: "CanViewNewNotes" })
  // processCustomPermission({ error, data }) {
  //   if (error) {
  //     console.log("messed up " + JSON.stringify(error));
  //   } else if (data) {
  //     this.canViewNewNotes = data;
  //   }
  // }

  @wire(CurrentPageReference) pageRef;

  isQueuedJobDone(status) {
    return status === this.QUEUED_JOB_FINISHED_INDICATOR;
  }

  get shouldDisplayCpniScript() {
    return (
      getFieldValue(this.acct, ACCOUNT_BILL_SOURCE_FIELD) === "Ensemble" &&
      getFieldValue(this.acct, CPNI_FIELD) &&
      getFieldValue(this.acct, CPNI_FIELD).indexOf("No") > -1
    );
  }

  get custNotesUrl() {
    return `/apex/CustomerNotesLEX?Id=${this.recordId}`;
  }

  get notShouldForceConfirmation() {
    return !this.shouldForceConfirmation;
  }

  get isVerified() {
    if (!this.callData) return false;
    const custAuthenticated = this.callData.custAuthenticated;
    return (
      custAuthenticated &&
      this.AUTHENTICATED_VALUES.includes(`${custAuthenticated.toUpperCase()}`)
    );
  }

  get commPrefIcon() {
    if (this.shouldConfirmCommPrefs) return "utility:report_issue";
    return null;
  }

  get isNotInForceMode() {
    return !this.shouldForceConfirmation && !this.shouldForceDiscountHandling;
  }

  get hasActiveAccountStatus() {
    return (
      ["Closed", "Final", "Write Off  : W-OFF", "Canceled"].indexOf(
        getFieldValue(this.acct, ACCOUNT_STATUS_FIELD)
      ) === -1
    );
  }

  loopPromise({ shouldExit, getPromise, onLoopDone, delay = 0 }) {
    // eslint-disable-next-line consistent-return
    getPromise().then(result => {
      if (!shouldExit(result))
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        return setTimeout(() => {
          this.loopPromise({
            shouldExit: shouldExit,
            getPromise: getPromise,
            onLoopDone: onLoopDone,
            delay: delay
          });
        }, delay);
      onLoopDone();
    }); //catch needed //on fail
  }

  findMyCall(callData) {
    const NO_RESULT = { index: -1, call: null };
    if (!this.recordId) return NO_RESULT;

    let i = callData.length;
    while (i--) {
      const call = callData[i];
      if (
        call.tabObjIds &&
        call.tabObjIds[0] &&
        call.tabObjIds[0].includes(this.recordId)
      ) {
        return { index: i, call: call };
      }
    }

    return NO_RESULT;
  }
  handleRedirect(){
    ConsoleApiBridge.callMethod({
      name: 'focusTab',
      apiType : 'workspace',
      parametersObject: {
        tabId:this.parentTabId,
      }
    })
  }
  connectedCallback() {
	const builder1 = new StatePersister.Builder().tabObjectId(this.recordId);
    this.verifyPersister = builder1.page("fromcaseverify").build();
    var isfrmglb = this.verifyPersister.getItem("isfrmglb");
    console.log("***entrance from Global**"+isfrmglb);
    if(isfrmglb == true){
      this.verifyPersister.setItem("isfrmglb", false);
      console.log("***entrance from Global1**"+isfrmglb);
      //this.hasVerifiedAcct = true;
      this.shouldShowModal = false;             
    }
	var today = new Date();
    var curtime = today.getTime();
    this.verificationStartTime = curtime;
    console.log('Current time is '+curtime);					   
	var currentURL = window.location.href;
    console.log('url @@@'+ decodeURI(currentURL));
    var isfromcaseflow = currentURL.includes("Case");
    var updateisfromcaseflow = false;
    if(isfromcaseflow == true){
      var compurl = currentURL.replace(/%2F/g, "/");
      console.log('After replacing ' +compurl);
      console.log('Index at '+compurl.indexOf("Case/"));
      var currentcaseid = compurl.substring(compurl.indexOf("Case/")+5, compurl.indexOf("Case/")+23);
      console.log('Case id is '+ currentcaseid);

      getCurrentCaseDetails({ curcaseid: currentcaseid })
      .then(result => {
          
          var resp = JSON.parse(result);
          console.log('Case details '+ JSON.stringify(resp));
          if(resp.caseRecordtypeName == 'Incoming Call'){
            updateisfromcaseflow = true; 
			if(resp.case.Status != 'Closed'){
              this.lockTab();
            }
            this.lockTab(); 
            console.log('from case flow '+ updateisfromcaseflow);
            updateRecord({
              fields: {
                Id: this.recordId,
                Is_From_Case_Flow__c: updateisfromcaseflow
              }
            }).catch(error => {
                console.log('case flow error'+error);
            });    
          }else{
			this.unlocktab();  
            updateRecord({
              fields: {
                Id: this.recordId,
                Is_From_Case_Flow__c: updateisfromcaseflow
              }
            }).catch(error => {
              console.log('case flow error'+error);
          });      
          }  
      })
      .catch(error => {
          console.log('Error while retriving current case '+ JSON.stringify(error));
      });

    }else{
      updateRecord({
          fields: {
            Id: this.recordId,
            Is_From_Case_Flow__c: updateisfromcaseflow
          }
        }).catch(error => {
          console.log('case flow error'+error);
      });
    }
	
	
    getMyParentTabId().then(parentTabId => {
      this.parentTabId = parentTabId;
      registerTabListener("servAddrUpdated", this.doLoopQual, this);
    });
	checkChatPermission()
    .then((resp) =>{
      if(resp){
        ConsoleApiBridge.callMethod({
          name: "getFocusedTabInfo",
          apiType: "workspace"
        }).then(resp => {
          ConsoleApiBridge.callMethod({
            name: "isSubtab",
            apiType: "workspace",
            parametersObject: {
              tabId: resp.tabId
            }
          }).then(resp => {
            if(resp){
              this.isSubtab = true;
            }
            console.log('is a subtab! '+resp);
          })
        });
      }
    })
    queryDatabase({
      query:
        "SELECT Name, AccountNumber,Account_Status__c,Billing_Source__c,Conversion_Status__c, Converted_Date__c,IsConverted_Account__c, RecordType.DeveloperName,RecordType.name,Previous_Account_Number__c FROM Account " +
        "WHERE Id = '" +
        this.recordId + 
        "'LIMIT 1"
    })
      .then(resp => {
        if (resp.length > 0) {
          this.record = resp[0];
          console.log("Response---->" + JSON.stringify(this.record));
		  
		  //Comments: Added for User story CSICC - 45251
		   // Comments : Update If condition wrt - CSAICC - 407 apply for CRIS and Ensamble both billing source.
          console.log("Status--->"+this.record.Account_Status__c);
          console.log("Billing Source--->"+this.record.Billing_Source__c);
         // if(this.record.Billing_Source__c === "CRIS" && this.record.Conversion_Status__c === "E"){
       if(this.record.Conversion_Status__c !== undefined && this.record.Conversion_Status__c === "E"){
         this.isDisabled = true;
         if(this.record.Billing_Source__c !== "CRIS"){
             this.isENSAccount = true;
         }
         else {
              this.OnCris_Embargo = true;
         }
       }
     //Comments: CSICC - 44851 : CRIS to Eshop Account
        var date1 = new Date();         
        var date2 = new Date(this.record.Converted_Date__c);         
        var differenceInTime = date1.getTime() - date2.getTime();         
        var differenceInDays = differenceInTime / (1000 * 3600 * 24);          
        console.log("Difference in days -->"+differenceInDays);               
        if((this.record.RecordType.Name === 'Postpaid Converted') && (this.record.IsConverted_Account__c === true) && (this.record.Previous_Account_Number__c !== undefined) &&  (differenceInDays <= CRISMessageDisplayDuration)){
			this.cris_Converted = true;
        }          
 //Comments: -------- CSICC - 44851 End ----------
          if (this.record.Billing_Source__c === "PPP") {	
            this.ppp_Billling = true;
			 this.doLoopQual(); //added  for INC3066192
            queueDvarIa({	
              strId: this.recordId,	
              DvarccvServiceAddr: ""	
            }).then( () =>{	
                	
              this.fireLoopQualFinished();	
            }).catch(e =>{	
              this.fireLoopQualFinished();	
            })	
          }else{	
            this.doLoopQual();	
          }
        }
      })
      .catch(err => {
        console.log(err);
      });
    const builder = new StatePersister.Builder().tabObjectId(this.recordId);
    
    this.statePersister = builder.page("AcctEntrance").build();
    this.ctiPersister = builder.page("CtiComponent").build();
    this.ctiPersister = builder
      .tabObjectId(this.MULTIPLE_MATCHING_ACCOUNTS_FAKE_ID)
      .build();
    let callData = this.ctiPersister.getItem(this.CALL_DATA_KEY);
    if (callData && Array.isArray(callData) && callData.length > 0) {
      const result = this.findMyCall(callData);
      callData = result.call || {};
      this.callDataIndex = result.index;
    } else callData = {};
    this.callData = callData.info || callData;
    this.hasVerifiedAcct = this.statePersister.getItem(
      this.ALREADY_VERIFIED_KEY
    );
    //if (this.hasVerifiedAcct) return;
    //this.doLoopQual();
    getSecureWifiIndicator({accoundId: this.recordId})
    .then( result =>{
      console.log("Wifi Indicator Success -> result", result)
    })
    .catch( err => {
      console.log("Wifi Indicator error -> err", err)
    });
    getServiceAddresses({ accId: this.recordId })
      .then(({ serviceAddresses, specialHandlingLabel }) => {
        if (serviceAddresses) {
          this.calloutData = {
            ...this.calloutData,
            serviceAddresses: serviceAddresses
          };
        }
        if (!specialHandlingLabel) return;
        const specialHandlingLabelText =
          SPECIAL_HANDLING_LABELS[specialHandlingLabel];
        if (!specialHandlingLabelText) return;

        this.addPgMsg({
          text: specialHandlingLabelText,
          severity: "warning",
          utilityIconName: "warning"
        });
      })
      .catch(error => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error",
            message: error,
            variant: "error"
          })
        );
      });

    getFixedWireLessMsg({ accId: this.recordId })
      .then(({ showFixedWirelessMessage = false, FixedWirelessMessage }) => {
        if (!showFixedWirelessMessage) return;
        this.addPgMsg({
          text: FixedWirelessMessage,
          severity: "warning",
          utilityIconName: "warning"
        });
      })
      .catch(error => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Error while displaying Fixed WireLess Message",
            message: error,
            variant: "error"
          })
        );
      });
    //Lester - moving MYCenturylink query to account verification cmp	
      getAccountErrorMessages({recordId: this.recordId})	
      .then(({	
        shouldConfirmCommPrefs = false,	
        shouldDisplayEshopWarning = false,	
        shouldDisplayDefaultServAddMsg = false,	
      }) =>{	
        this.shouldConfirmCommPrefs =	
            shouldConfirmCommPrefs && this.hasActiveAccountStatus;	
          if (shouldDisplayEshopWarning)	
            this.addPgMsg({	
              text: eShopWarningLabel,	
              severity: "error",	
              utilityIconName: "error"	
            });	
          if (this.shouldConfirmCommPrefs)	
            this.addPgMsg({	
              text: CONFIRMATION_REQ_MSG,	
              severity: "warning",	
              utilityIconName: "warning"	
            });	
          if (shouldDisplayDefaultServAddMsg)	
            this.addPgMsg({	
              text: defaultSerAddrLabel,	
              severity: "warning",	
              utilityIconName: "warning"	
            });	
            if (this.shouldDisplayCpniScript)	
            this.addPgMsg({	
              text: cpniLegalScript,	
              severity: "warning",	
              utilityIconName: "announcement"	
            });	
      })
  }

  disconnectedCallback() {
    this.isStillOnAccount = false;
    unregisterAllListeners(this);
    unregisterAllTabListeners(this);
  }

  renderedCallback() {
    if (this.hasRendered) return;
    this.hasRendered = true;
    this.unloadPgMsgQueue();
  }

  handleClick(e) {
    this.isDisabled = true;
    const target = e.target;
    const elementType = target.nodeName;
    if (elementType !== "LIGHTNING-BUTTON") return;
    const buttonName = target.label;
    const verificationData = this.template.querySelector(
      "c-account-verification"
    ).formData;
    this.doVerify(buttonName, verificationData);
  }

  // eslint-disable-next-line consistent-return
  get pgMsgDisplayer() {
    if (!this.hasRendered) return null;
    if (!this.pgMsgCmp)
      this.pgMsgCmp = this.template.querySelector("c-page-message");
    return this.pgMsgCmp;
  }

  fireLoopQualFinished() {
    fireEvent(this.pageRef, "loopQualIsFinished");
    fireTabEvent(this.parentTabId, "loopQualIsFinished");
  }

  addPgMsg(msg) {
    if (!this.pgMsgDisplayer) return this.queuePgMsg(msg);
    this.pgMsgDisplayer.addMessage(msg);
  }

  queuePgMsg(msg) {
    this.pgMsgQueue = [...this.pgMsgQueue, msg];
  }

  unloadPgMsgQueue() {
    this.pgMsgQueue = this.pgMsgQueue.filter(msg => {
      this.pgMsgDisplayer.addMessage(msg);
      return false;
    });
  }

  doLoopQual() {
    if (!this.isStillOnAccount) return;
    let startTime, endTime, elapsedSecond;
    console.log('STARTING DVAR CCV');
    startTime = new Date().getTime();
    dvarCcvContinuation({ accId: this.recordId }) // eslint-disable-next-line consistent-return
      .then(
        ({
          ssn = this.GENERIC_ERROR_MESSAGE,
          Hint = this.GENERIC_ERROR_MESSAGE,
          pin = this.GENERIC_ERROR_MESSAGE,
          ccnumber = this.GENERIC_ERROR_MESSAGE,
          deapUrl,
          dvarCcvServiceAddress,
          isCHIAAddress
        }) => {
          endTime = new Date().getTime();
          elapsedSecond = (endTime - startTime) / 1000;
          console.log(
      "Time Taken for DVAR CCV call " 
      +elapsedSecond
    );
          this.calloutData = {
            ...this.calloutData,
            ssn,
            Hint,
            pin,
            deapUrl,
            ccnumber
          };
          
          console.log("Firing GEOES REquest");
          /*
          const CHIAAddressCount = getFieldValue(
            this.acct,
            CHIA_Address_Count_FIELD
          );*/

          if (!isCHIAAddress && this.isStillOnAccount) {
            this.doGeoEsStuff(this.recordId, dvarCcvServiceAddress);
          }
        }
      )
      .catch(e => {
        console.log("error", e);
        this.fireLoopQualFinished();
		/*console.log(">>>startCallout- RepairTktCallout");
		invokeRepairTktCallout({ strId: this.recordId }); */   //CSICC-18323 
        this.calloutData = {
          ...this.calloutData,
          ssn: this.GENERIC_ERROR_MESSAGE,
          Hint: this.GENERIC_ERROR_MESSAGE,
          pin: this.GENERIC_ERROR_MESSAGE,
          ccnumber: this.GENERIC_ERROR_MESSAGE
        };
      });
  }

  doGeoEsStuff(acctId, dvarCcvServiceAddress) {
    const self = this;
    let srvIdCall = "";
    let srvStreetCall = "";
    let srvAaddressLine2Call = "";
    let srvCityCall = "";
    let srvStateCall = "";
    let srvZipCodeCall = "";
    let srvAddressSourcesCall = "";
    let srvRecords;
    let srvApiNumber = 0;
    let srvAccLegacyStack = "{!accLegacyStack}";
    let srvAddressValidationGEOESSplit = GEOESAddressVal.split(";");
    let srvTotalAPICallsToMake = Number(srvAddressValidationGEOESSplit[0]);
    const originalCCVList = dvarCcvServiceAddress;
    executeGEOESRequest(acctId, dvarCcvServiceAddress);
    function executeGEOESRequest(accId, DvarccvServiceAddr) {
      let startTime, endTime, elapsedSecond;
      console.log("executeGEOESRequest- accId:" + accId);
      console.log(
        "executeGEOESRequest- DvarccvServiceAddr:" + DvarccvServiceAddr
      );
      startGEOESRequest();
      function startGEOESRequest() {
        console.log(
          "startGEOESRequest- srvTotalAPICallsToMake:" + srvTotalAPICallsToMake
        );
        if (
          DvarccvServiceAddr === "[]" ||
          DvarccvServiceAddr === "" ||
          DvarccvServiceAddr === undefined
        ) {
          // Read Locations
          console.log("startGEOESRequest- START DB Query Call");
          try {
            queryDatabase({
              query:
                "Select Id, Address_Sources__c, Service_Address_Source_Id__c,Service_Street__c,Service_Street_2__c," +
                "Service_City__c, Service_State__c, Service_Postal_Code__c " +
                "FROM Service_Address__c " +
                "WHERE Billing_Account__c= '" +
                accId +
                "' AND Active__c=True ORDER BY Primary_Service_Address__c DESC, CreatedDate DESC LIMIT " +
                srvAddressValidationGEOESSplit[0]
            }).then(resp => {
              if (resp.length > 0) {
                srvRecords = resp;
                console.log(
                  "startGEOESRequest- DB Query Call FOUND:" + resp.length
                );
                loadDBSrvAddr();
                console.log("startGEOESRequest- srvStreet:" + srvStreetCall);
                submitCalls(accId, DvarccvServiceAddr);
              } else {
                console.log("startGEOESRequest- END DB Query Call NOT FOUND");
                self.fireLoopQualFinished();
              }
            });
          } catch (e) {
            console.log("startGEOESRequest- DB Query Call Fail:" + e);
          }
        } else {
          loadDVARSrvAddr(DvarccvServiceAddr);
          submitCalls(accId, DvarccvServiceAddr);
        }
      }
      function submitCalls(recordIdCall, DvarccvServiceAddrCall) {
        let GEOESresult = "";
        startTime = new Date().getTime();
        if (
          (!srvAddressSourcesCall || !srvAddressSourcesCall.includes("CLC")) &&
          srvApiNumber < srvTotalAPICallsToMake
        ) {
          if (
            srvAaddressLine2Call === null ||
            srvAaddressLine2Call === undefined
          ) {
            srvAaddressLine2Call = "";
          }
          console.log("submitCalls- Callback started for API " + srvApiNumber);
          console.log(
            "submitCalls- srvIdCall:" +
              srvIdCall +
              " accountId:" +
              recordIdCall +
              " srvStreetCall:" +
              srvStreetCall +
              "addressLine2:" +
              srvAaddressLine2Call +
              " srvCityCall:" +
              srvCityCall +
              " srvStateCall:" +
              srvStateCall +
              " srvZipCode:" +
              srvZipCodeCall +
              " srvAddressSourcesCall:" +
              srvAddressSourcesCall
          );
          if (!self.isStillOnAccount) return;
          geoesContinuation({
            srvId: srvIdCall,
            accountId: recordIdCall,
            srvStreet: srvStreetCall,
            addressLine2: srvAaddressLine2Call,
            srvCity: srvCityCall,
            srvState: srvStateCall,
            srvZipCode: srvZipCodeCall
          })
            .then(resp => {
              GEOESresult = resp;
              endTime = new Date().getTime();
              elapsedSecond = (endTime - startTime) / 1000;
              console.log(
                "Time Taken for API " +
                  srvApiNumber +
                  " : " +
                  srvStreetCall +
                  " : " +
                  elapsedSecond +
                  " sec , Response : " +
                  GEOESresult
              );

              // If address already contains CLC or if srvApiNumber < label.CLC_limit then no callout and done ==> go to endCalls.
              if (
                (!srvAddressSourcesCall ||
                  !srvAddressSourcesCall.includes("CLC")) &&
                srvApiNumber < srvTotalAPICallsToMake - 1 &&
                GEOESresult === "Success"
              ) {
                srvApiNumber++;
                if (srvRecords && srvRecords.length >= srvApiNumber + 1) {
                  loadDBSrvAddr();
                } else {
                  //Use DVAR Response
                  if (DvarccvServiceAddr.length >= srvApiNumber + 1) {
                    loadDVARSrvAddr(originalCCVList);
                  }
                }
                submitCalls(recordIdCall, DvarccvServiceAddrCall);
              }else{
              console.log(">>>executeGEOESRequest END");
              console.log(">>>Starting DVAR IA Request");
                let startTime, endTime, elapsedSecond;
                startTime = new Date().getTime();
              if (!self.isStillOnAccount) {
                return;
              }
              if (DvarccvServiceAddrCall)
                return queueDvarIa({
                  strId: recordIdCall,
                  DvarccvServiceAddr: originalCCVList
                }).then( () =>{
                  endTime = new Date().getTime();
                  elapsedSecond = (endTime - startTime) / 1000;
                  console.log("Time Taken for DVAR IA call " +elapsedSecond);
					/*	console.log(">>>startCallout- RepairTktCallout");
				invokeRepairTktCallout({ strId: recordIdCall });*/ //CSICC-18323
                  self.fireLoopQualFinished();
                }).catch(()=>{
                  endTime = new Date().getTime();
                  elapsedSecond = (endTime - startTime) / 1000;
                  console.log("Time Taken for DVAR IA call " +elapsedSecond);
					/*	console.log(">>>startCallout- RepairTktCallout");
				invokeRepairTktCallout({ strId: recordIdCall }); */ //CSICC-18323
                  self.fireLoopQualFinished();
                });
              return queueDvarIa({
                strId: recordIdCall,
                DvarccvServiceAddr: ""
              }).then( () =>{
                  
                self.fireLoopQualFinished();
				/*console.log(">>>startCallout- RepairTktCallout");
				invokeRepairTktCallout({ strId: recordIdCall });*/ //CSICC-18323
              }).catch(()=>{
                /*console.log(">>>startCallout- RepairTktCallout");
				invokeRepairTktCallout({ strId: recordIdCall });*/  //CSICC-18323
                self.fireLoopQualFinished();
              });
            }
            })
            .then(() => {
				/*console.log(">>>startCallout- RepairTktCallout");
				invokeRepairTktCallout({ strId: recordIdCall });*/ //CSICC-18323
              self.fireLoopQualFinished();
            })
            .catch(e => {
              self.fireLoopQualFinished();
			  /*console.log(">>>startCallout- RepairTktCallout");
				invokeRepairTktCallout({ strId: recordIdCall });*/ //CSICC-18323
              console.log("submitCalls- Callback completed Error:" + e);
            });
        } else {
          // Turned off, max calls or CLC found
          console.log(">>>executeGEOESRequest END2");
          endCallout(recordIdCall, DvarccvServiceAddrCall);
        }
      }
    }
    function loadDBSrvAddr() {
      console.log("loadDBSrvAddr- srvRecords.length:" + srvRecords.length);
      if (srvRecords.length >= srvApiNumber + 1) {
        // Use Service Addresses
        if (srvTotalAPICallsToMake > srvRecords.length) {
          srvTotalAPICallsToMake = srvRecords.length;
        }
        srvIdCall = srvRecords[srvApiNumber].Id;
        srvStreetCall = srvRecords[srvApiNumber].Service_Street__c;
        srvAaddressLine2Call = srvRecords[srvApiNumber].Service_Street_2__c;
        srvCityCall = srvRecords[srvApiNumber].Service_City__c;
        srvStateCall = srvRecords[srvApiNumber].Service_State__c;
        srvZipCodeCall = srvRecords[srvApiNumber].Service_Postal_Code__c;
        srvAddressSourcesCall = srvRecords[srvApiNumber].Address_Sources__c;
      } else {
        srvIdCall = srvStreetCall = srvAaddressLine2Call = srvCityCall = srvStateCall = srvZipCodeCall = srvAddressSourcesCall =
          "";
      }
    }
    function loadDVARSrvAddr(DvarccvServiceAddrString) {
      //TODO DVARCCV should return all exact match service addresses in an array for processing here.
      // and The call to DVAR_IA should be refactored to send the srvApiNumber if it gets a CLC response from GEOES
      let DvarccvServiceAddr = JSON.parse(DvarccvServiceAddrString );
      console.log(
        "loadDVARSrvAddr-DvarccvServiceAddr.length:" +
          DvarccvServiceAddr.length +
          " srvApiNumber:" +
          srvApiNumber
      );
      if (DvarccvServiceAddr.length >= srvApiNumber + 1) {
        if (srvTotalAPICallsToMake > DvarccvServiceAddr.length) {
          srvTotalAPICallsToMake = DvarccvServiceAddr.length;
        }
        if (srvAccLegacyStack === "Legacy CenturyLink") {
          srvStreetCall = DvarccvServiceAddr[srvApiNumber].PrimaryLine;
        } else {
          srvStreetCall = DvarccvServiceAddr[srvApiNumber].AddressLine1;
        }
        srvAaddressLine2Call = "";
        srvCityCall = DvarccvServiceAddr[srvApiNumber].locality;
        srvStateCall = DvarccvServiceAddr[srvApiNumber].stateOrProvince;
        srvZipCodeCall = DvarccvServiceAddr[srvApiNumber].postalcode;
        srvAddressSourcesCall = "";
      } else {
        srvIdCall = srvStreetCall = srvAaddressLine2Call = srvCityCall = srvStateCall = srvZipCodeCall = srvAddressSourcesCall =
          "";
      }
    }
    function endCallout(recordIdCall, DvarccvServiceAddrCall) {
      //TODO RemoteActionUpdate  - AccountVerificationExtension.UpdateDVAR_IARecord(srvId, DVARCCVAddressSeq, function (result, event) {
      //TODO USe this function for all DVAR_IA callouts
      console.log(
        ">>>endCallout- recordIdCall:" +
          recordIdCall +
          " DvarccvServiceAddrCall:" +
          DvarccvServiceAddrCall
      );

      if (!DvarccvServiceAddrCall) DvarccvServiceAddrCall = "";
      if (!self.isStillOnAccount) {
        return;
      }
      queueDvarIa({
        strId: recordIdCall,
        DvarccvServiceAddr: DvarccvServiceAddrCall
      })
        .then(() => {
          self.fireLoopQualFinished();
		  /*console.log(">>>startCallout- RepairTktCallout");
				invokeRepairTktCallout({ strId: recordIdCall });*/ //CSICC-18323
        })
        .catch(e => {
          self.fireLoopQualFinished();
		  /*console.log(">>>startCallout- RepairTktCallout");
				invokeRepairTktCallout({ strId: recordIdCall });*/ //CSICC-18323
          console.log("submitCalls- Callback completed Error:" + e);
        });
    }
    //END GEOES US314437 functions in connectedCallback
    function isQueuedJobDone(status) {
      return status === "Completed";
    }

    function loopPromise({ shouldExit, getPromise, onLoopDone, delay = 0 }) {
      // eslint-disable-next-line consistent-return
      getPromise().then(result => {
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        if (!shouldExit(result))
          return setTimeout(() => {
            loopPromise({
              shouldExit: shouldExit,
              getPromise: getPromise,
              onLoopDone: onLoopDone,
              delay: delay
            });
          }, delay);
        onLoopDone();
      });
      //catch needed
      //on fail
    }
  }

  hideModal() {
    this.shouldShowModal = false;
  }

  handleDiscountHandlingSave() {
    //this.hideModal();
	this.navigateToCaseFlow();
  }

  handleCommPrefsConfirmed() {
    if (this.discountErrMsgs.length > 0 && this.hasActiveAccountStatus) {
      this.shouldForceDiscountHandling = true;
      return;
    } // eslint-disable-next-line @lwc/lwc/no-async-operation

    setTimeout(() => {
      //this.hideModal();
	  this.navigateToCaseFlow();
    }, 2000);
  }

  doVerify(buttonName, verificationData) {
    const {
      formStatus,
      cpni,
      authorizedContactId,
      authorizedContactName,
      callIntent
    } = verificationData;
	const accountStatus = getFieldValue(this.acct, ACCOUNT_STATUS_FIELD);
    if (buttonName !== "Research" && !formStatus.isValid) {
      this.isDisabled = false;
      this.dispatchEvent(new ShowToastEvent(formStatus.errorMessage));
      return;
    }
	var vEnd = new Date();
    var curtime = vEnd.getTime();
    console.log('Current time is '+curtime);
    this.verificationEndTime = curtime;					  
	//CSAICC-481 Start
    if (buttonName == "Verified") {
		this.calcualteTimeduration(this.verificationStartTime,this.verificationEndTime);
      /*ValidateJSRecords({accId : this.recordId , userId : USER_ID,calltype : callIntent})
      .then(resp => {
        console.log('Resp &&& '+ resp);
        if(resp == "Success"){
          this.calcualteTimeduration(this.verificationStartTime,this.verificationEndTime);
        }
        
      })
      .catch( err => {
        console.log("Validate JourneySurvey record -> err", err);
          
      })*/
        
    }
    //CSAICC-481 End
    if (this.callDataIndex > -1) {
      const callData = this.ctiPersister.getItem(this.CALL_DATA_KEY); //remove my call and all calls that preceded it
      callData.splice(0, this.callDataIndex + 1);
      this.ctiPersister.setItem(this.CALL_DATA_KEY, callData);
    }
    updateRecord({
      fields: {
        Id: this.recordId,
        [CPNI_FIELD.fieldApiName]: this.cpni
      }
    }).catch(error => {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message: error.body.message,
          variant: "error"
        })
      );
    });
    saveTask({
      verificationType:
        buttonName === "Research" ? buttonName + " Account" : buttonName,
      callIntent: callIntent,
      numberCalled: this.callData.numberCalled,
      contactNumber: this.callData.contactNumber,
      authConName: authorizedContactName,
      authConId: authorizedContactId,
      accCpni: cpni,
      accId: this.recordId,
      custAuthenticated: this.callData.custAuthenticated,
      ucid: this.callData.ucid,
      isCustomerFullyAuthenticated: this.isCustomerFullyAuthenticated,
	  accountStatus: accountStatus
    }).catch(error => {
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error",
          message: error.body.message,
          variant: "error"
        })
      );
    });
    new StatePersister.Builder()
      .tabObjectId(this.recordId)
      .page("AcctVer")
      .build()
      .setItem("verifiedCaller", this.authorizedContactName);
    this.statePersister.setItem("buttonClicked", buttonName);
    this.statePersister.setItem(this.ALREADY_VERIFIED_KEY, true);
    this.statePersister.setItem("ucid", this.callData.ucid);
    this.statePersister.setItem("callIntent", callIntent);
    fireEvent(this.pageRef, "acctEntranceLocStorUpdated");
    this.lockTab();
    if (buttonName === "Verified") {
      if (this.shouldConfirmCommPrefs) {
        this.shouldForceConfirmation = true;
        if (this.ppp_Billling !== null && this.ppp_Billling === true) {
          const commPrefPrepaid = this.template.querySelector(
            "c-communication-preference-pre-paid"
          );
          if (commPrefPrepaid) {
            commPrefPrepaid.confirmPreferences();
          }
        } else {
          const commPref = this.template.querySelector(
            "c-communication-preferences"
          );
          if (commPref) {
            commPref.confirmPreferences();
          }
        }
        return;
      }
      if (this.discountErrMsgs.length > 0 && this.hasActiveAccountStatus) {
        this.shouldForceDiscountHandling = true;
        return;
      }
      this.showDowngradepopup();
    }
    /*if(caseId != '') {
    	
    	navigateToViewRecordPage(caseId)
    }*/
    if (buttonName === "Research") {
      this.showDowngradepopup();
    } else if (buttonName === "Not Verified") {
      //this.hideModal();
	  this.navigateToCaseFlow();
    }
  }
  navigateToCaseFlow() {
    this.hideModal();
    let caseId = '';
    isUserRepairPilot({userId : USER_ID})
    .then( result => {
      console.log('%%%Repair'+result);
      if(result === true){
      createNewCase({ accId : this.recordId})
      .then( result =>{
      console.log("doVerify -> result", result)
		  if(result != 'False'){
        caseId = result;
        isUserRepairPilotwithCaseflow({userId : USER_ID})
        .then(accessresp => {
            if(accessresp === true){
              if(caseId != '') {
                console.log('%%%Inside ');
                this.unlocktab();
                this.closePrimaryTab();
                  
                  ConsoleApiBridge.callMethod({
                    name: "openTab",
                    apiType: "workspace",
                    parametersObject: {
                      recordId: caseId,
                      focus: true
                    }
                  });
                  
              }
            }
        })
			  
		  }
      })
      .catch( err => {
      console.log("doVerify -> err", err)
        
      })
    }else{
      console.log('%%%Repair'+result);
    }
    }).catch( err => {
      console.log(err);
    });
  }
  /*navigateToViewRecordPage(caseId) {
      this[CurrentPageReference.Navigate]({
          type: 'standard__recordPage',
          attributes: {
              "recordId": caseId,
              "objectApiName": "Case",
              "actionName": "view"
          },
      });
  }*/
  
  showDowngradepopup() {
    queryDatabase({
      query:
        "SELECT Name, Billing_Source__c,IsSpeedsDownGraded__c,Legacy_Stack__c, isESHOPAccount__c " +
        "FROM Account " +
        "WHERE Id = '" +
        this.recordId +
        "'"
    }).then(resp1 => {
      this.Account = resp1[0];
      if (this.Account.IsSpeedsDownGraded__c) {
        this.openmodel = true;
      } else {
        //this.hideModal();
		this.navigateToCaseFlow();
      }
    });
  }

  
  lockTab() {
    ConsoleApiBridge.callMethod({
      name: "getEnclosingTabId",
      apiType: "workspace"
    }).then(tabId => {
      return ConsoleApiBridge.callMethod({
        name: "disableTabClose",
        apiType: "workspace",
        parametersObject: {
          tabId: tabId,
          disabled: true
        }
      });
    });
  }

  unlocktab(){
    ConsoleApiBridge.callMethod({
      name: "getEnclosingTabId",
      apiType: "workspace"
    })
      .then(tabId => {
        console.log('close tab from account vf' + JSON.stringify(tabId));
        return ConsoleApiBridge.callMethod({
        name: "disableTabClose",
        apiType: "workspace",
        parametersObject: {
            tabId:tabId,
            disabled: false
        }
        });
        
      })
      .catch(err => {
        console.log('error ' + JSON.stringify(err));
      });    
  }
  closePrimaryTab() {
    ConsoleApiBridge.callMethod({
      name: "getEnclosingTabId",
      apiType: "workspace"
    })
      .then(tabId => {
        return ConsoleApiBridge.callMethod({
          name: "closeTab",
          apiType: "workspace",
          parametersObject: {
            tabId: tabId
          }
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

  handleModalClose() {
    this.closePrimaryTab();
  }
  ErrorMsg(event) {
    this.errorMsg1 = event.detail;
    this.isBln = true;
  }

  pppmsg(event) {
    this.pppMsg1 = event.detail;
    this.ispppBln = true;
  }

  closeModal() {
    this.openmodel = false;
    //this.hideModal();
	this.navigateToCaseFlow();
  }
  calcualteTimeduration(starttime , endtime) {
      console.log('End time -' + endtime + '&&& start time'+starttime );
      var timetake = (endtime - starttime)/1000;
      var Roundofftime = timetake.toFixed(0);
      console.log('time duration is '+Roundofftime);
      
      updateRecord({
        fields: {
          Id: this.recordId,
          Verification_Time__c: Roundofftime
        }
      }).catch(error => {
          console.log('Update duration time error'+error);
      }); 
  }											  
}