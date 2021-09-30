import { LightningElement, api } from 'lwc';
import queryDatabase from "@salesforce/apex/LwcUtils.queryDatabase";
import sendRccApex from "@salesforce/apex/SendRccController.sendRccToMC";
import getQuoteInfo from "@salesforce/apex/SendRccController.getQuoteInfoCallout";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import styles from "@salesforce/resourceUrl/rccAcceptance";
import { loadStyle } from "lightning/platformResourceLoader";
import ConsoleApiBridge from "c/consoleApiBridge";

export default class AgentSendRCC extends LightningElement {
    @api recordId;
    @api canSendTestEmails;
    @api canSendSMS;
    completionDate;
    disconnectDate;
    Loading = false;
    showValue = true;
    isCRISacc;
    didPreview = false;
    myVal;
    initialAccNumBlank = false;
    orderType;
    orderNumber;
    resp;
    acceptType = '';
    formats = ['font', 'size', 'bold', 'italic', 'underline',
    'strike', 'list', 'indent', 'align', 'link',
    'image', 'clean', 'table', 'header', 'color',
    'background', 'code', 'code-block', 'script', 'blockquote', 'direction'];

    closeModal() {
        // to close modal set isModalOpen tarck value as false
        this.dispatchEvent(
            new CustomEvent("closeRCCModal")
          );
    }
    backgroundString;
    changingRadioGroup(evt){
        console.log(evt.target.value);
        this.acceptType = evt.target.value;
    }
    get isEmailSelected(){
        console.log(this.acceptType);
        return this.acceptType == 'Email';
    }
    get isSMSSelected(){
        return this.acceptType == 'SMS';
    }
	get getSMSVerbiage(){
        if(this.resp && this.resp.SMS_Number__pc){
            return 'I can send you a text message with the order quote for your approval. I have your mobile number as '+this.resp.SMS_Number__pc+', is that correct?';
        }
        return 'I can send you a text message with the order quote for your approval. What is your mobile phone number?';
    }
    connectedCallback(){
        console.log(window.location.origin);
        loadStyle(this, styles);
        console.log(this.recordId);
        console.log('Connected Callback');
        queryDatabase({
            query:
              "SELECT Id, Accountnumber, PersonEmail,SMS_Number__pc, Billing_Source__c FROM Account WHERE id = '" + 
              this.recordId +
              "'"
          }).then(resp => {
            console.log(resp);
            this.resp = resp[0];
            if(this.resp.Billing_Source__c == 'CRIS'){
                this.isCRISacc = true;
            }
            console.log("*************** "+ this.resp.AccountNumber);
            if(!this.resp.AccountNumber){
                console.log("***************");
                this.initialAccNumBlank = true;
            }
          });
    }
    changeVal(evt){
        console.log('Changing');
        
    }
    doPreviewCall(){
         var accNum = this.template.querySelector('[data-id="accountNumberField"]');
        this.Loading = true;
        getQuoteInfo({ accountId:this.resp.Billing_Account__c, Accountnumber:accNum.value})
            .then(resp =>{
                console.log(resp);
                if(!resp){
                    const evt = new ShowToastEvent({
                        title: 'RCC Error',
                        message: 'Error retrieving quote. Please use your standard RCCs',
                        variant: 'error',
                    });
                    this.dispatchEvent(evt);
                    this.Loading = false;
                    return;
                }
                var Obj = JSON.parse(resp);
                if(!Obj || !Obj.orderDetail){
                    const evt = new ShowToastEvent({
                        title: 'RCC Error',
                        message: 'Error retrieving quote. Please use your standard RCCs',
                        variant: 'error',
                    });
                    this.dispatchEvent(evt);
                    this.Loading = false;
                    return;
                }
                console.log(Obj);

                if(Obj && Obj.orderDetail && Obj.orderDetail.importantInfo && Obj.orderDetail.importantInfo.orderNumber ){
                    
                    let orderString = Obj.orderDetail.importantInfo.orderNumber.split(': ');
                    this.orderType = orderString[0];
                    if(orderString && orderString.length >1){
                        this.orderNumber = orderString[1];
                    }else if(orderString && orderString.length ==1){
                        this.orderNumber = orderString[0];
                    }
                }
                console.log(this.orderType);
                var OrderDetail = Obj.orderDetail;
                var OrderCharges = OrderDetail.charges;
                var NextMonthCharges = OrderDetail.nextMonthBill;
                var OrderChargesLength = OrderCharges.length;
                var newquoteid = OrderDetail.importantInfo.reference;
                var builtOutHTMLText = "<table  style='width:811px;border-spacing: 0;border:2px solid #48d597; margin-right: auto; margin-left:auto; border-radius:10px 10px 0px 0px; padding: 10px;background: #48d597;'>";
                builtOutHTMLText += "<tr><td align='center' style='color: black;font-weight: bold;'>Account Information & Order Confirmation</td></tr></table>";
                builtOutHTMLText += "<table style='width:811px;border-spacing: 0;border:2px solid #48d597; border-radius:0px 0px 10px 10px; padding: 20px;margin-left: auto;margin-right: auto;' border='0'>";
                for (var i = 0; i < OrderChargesLength; i++) {
                    var OrderChargesObj = OrderCharges[i];
                    builtOutHTMLText += "<tr><th align='left' style='border-bottom: 2px solid black;'>" + OrderChargesObj.title + "</th><th align='right' style='border-bottom: 2px solid black;'>" + (OrderChargesObj.subtotal) + "</th>";
                    var itemLenght = OrderChargesObj.items.length;
                    var OrderChargesItem = OrderChargesObj.items;
                    for (var j = 0; j < itemLenght; j++) {
                        var OrderChargesItemObj = OrderChargesItem[j];
                        if (OrderChargesItemObj.price != null && OrderChargesItemObj.price != 0) {
                            builtOutHTMLText += "<tr><td align='left' style='padding-left:15px;font-weight:bold;'>Service for : " + OrderChargesItemObj.name + "</td><td align='right' style='font-weight:bold;'>" + OrderChargesItemObj.price + "</td>";
                        } else {
                            builtOutHTMLText += "<tr><td align='left' style='padding-left:15px;font-weight:bold;'>Service for : " + OrderChargesItemObj.name + "</td><td align='right' style='font-weight:bold;'>" + '' + "</td>";
                        }
                        var OrderChargesItemSubItem = OrderChargesItemObj.subItems;
                        var OrderChargesItemObjSubItemsLength = OrderChargesItemSubItem.length;
                        for (var k = 0; k < OrderChargesItemObjSubItemsLength; k++) {
                            var OrderChargesItemSubItemObj = OrderChargesItemSubItem[k];
                            if (OrderChargesItemSubItemObj.price != null && OrderChargesItemSubItemObj.price != 0) {
                                builtOutHTMLText += "<tr><td align='left' style='padding-left:25px'>" + OrderChargesItemSubItemObj.name + "</td><td align='right'>" + OrderChargesItemSubItemObj.price + "</td>";
                            } else {
                                builtOutHTMLText += "<tr><td align='left' style='padding-left:25px'>" + OrderChargesItemSubItemObj.name + "</td><td align='right'>" + '' + "</td>";
                            }



                            var OrderChargesItemSubItemSubItem = OrderChargesItemSubItemObj.subItems;
                            if (OrderChargesItemSubItemSubItem != null) {
                                var subItemlength = OrderChargesItemSubItemSubItem.length;
                                for (var l = 0; l < subItemlength; l++) {
                                    var OrderChargesItemSubItemSubItemObj = OrderChargesItemSubItemSubItem[l];
                                    if (OrderChargesItemSubItemSubItemObj.price != null && OrderChargesItemSubItemSubItemObj.price != 0) {
                                        builtOutHTMLText += "<tr><td align='left' style='padding-left:35px;'>" + OrderChargesItemSubItemSubItemObj.name + "</td><td align='right'>" + OrderChargesItemSubItemSubItemObj.price + "</td>";
                                    } else {
                                        builtOutHTMLText += "<tr><td align='left' style='padding-left:35px;'>" + OrderChargesItemSubItemSubItemObj.name + "</td><td align='right'>" + '' + "</td>";
                                    }




                                }
                            }

                        }
                    }
                    builtOutHTMLText += "</tr>";
                }
                if (NextMonthCharges != null) {

                    builtOutHTMLText += "<tr><th align='left' style='border-bottom: 2px solid black;'>" + NextMonthCharges.title + "</th><th align='right' style='border-bottom: 2px solid black;'>" + (NextMonthCharges.subtotal) + "</th>";
                    var OrderChargesItem = NextMonthCharges.items;
                    var itemLenght = OrderChargesItem.length;
                    for (var j = 0; j < itemLenght; j++) {
                        var OrderChargesItemObj = OrderChargesItem[j];
                        if (OrderChargesItemObj.price != null && OrderChargesItemObj.price != 0) {
                            builtOutHTMLText += "<tr><td align='left' style='padding-left:15px;font-weight:bold;'>Service for : " + OrderChargesItemObj.name + "</td><td align='right' style='font-weight:bold;'>" + OrderChargesItemObj.price + "</td>";
                        }
                        var OrderChargesItemSubItem = OrderChargesItemObj.subItems;
                        var OrderChargesItemObjSubItemsLength = OrderChargesItemSubItem.length;
                        for (var k = 0; k < OrderChargesItemObjSubItemsLength; k++) {
                            var OrderChargesItemSubItemObj = OrderChargesItemSubItem[k];
                            if (OrderChargesItemSubItemObj.price != null &&
                                OrderChargesItemSubItemObj.price != 0) {
                                builtOutHTMLText += "<tr><td align='left' style='padding-left:25px' colspan='2'>" + OrderChargesItemSubItemObj.name + "</td><td align='right'>$" + OrderChargesItemSubItemObj.price + "</td>";
                            } else {
                                builtOutHTMLText += "<tr><td align='left' style='padding-left:25px' colspan='2'>" + OrderChargesItemSubItemObj.name + "</td>";
                            }
                            var OrderChargesItemSubItemSubItem = OrderChargesItemSubItemObj.subItems;
                            if (OrderChargesItemSubItemSubItem != null) {
                                var subItemlength = OrderChargesItemSubItemSubItem.length;
                                for (var l = 0; l < subItemlength; l++) {
                                    var OrderChargesItemSubItemSubItemObj = OrderChargesItemSubItemSubItem[l];
                                    if (OrderChargesItemSubItemSubItemObj.price != null &&
                                        OrderChargesItemSubItemSubItemObj.price != 0) {
                                        builtOutHTMLText += "<tr><td align='left' style='padding-left:35px'>" + OrderChargesItemSubItemSubItemObj.name + "</td><td align='right'>$" + OrderChargesItemSubItemSubItemObj.price + "</td>";
                                    } else {
                                        builtOutHTMLText += "<tr><td align='left' style='padding-left:35px'>" + OrderChargesItemSubItemSubItemObj.name + "</td><td align='right'>$" + '' + "</td>";
                                    }
                                }
                            }

                        }
                    }

                }
                var futureBills = OrderDetail.futureBills;
                var futureBillslength = futureBills.length;
                for (var i = 0; i < futureBillslength; i++) {
                    var OrderChargesObj = futureBills[i];
                    builtOutHTMLText += "<tr><th align='left' style='border-bottom: 2px solid black;'>" + OrderChargesObj.title + "</th><th align='right' style='border-bottom: 2px solid black;'>" + (OrderChargesObj.subtotal) + "</th>";
                    var itemLenght = OrderChargesObj.items.length;
                    var OrderChargesItem = OrderChargesObj.items;
                    for (var j = 0; j < itemLenght; j++) {
                        var OrderChargesItemObj = OrderChargesItem[j];
                        var OrderChargesItemSubItem = OrderChargesItemObj.subItems;
                        var OrderChargesItemObjSubItemsLength = OrderChargesItemSubItem.length;
                        for (var k = 0; k < OrderChargesItemObjSubItemsLength; k++) {
                            var OrderChargesItemSubItemObj = OrderChargesItemSubItem[k];
                            builtOutHTMLText += "<tr><td align='left' style='padding-left:25px' colspan='2'>" + OrderChargesItemSubItemObj.name + "</td>";
                            var OrderChargesItemSubItemSubItem = OrderChargesItemSubItemObj.subItems;
                            if (OrderChargesItemSubItemSubItem != null) {
                                var subItemlength = OrderChargesItemSubItemSubItem.length;
                                for (var l = 0; l < subItemlength; l++) {
                                    var OrderChargesItemSubItemSubItemObj = OrderChargesItemSubItemSubItem[l];
                                    builtOutHTMLText += "<tr><td align='left' style='padding-left:35px' colspan='2'>" + OrderChargesItemSubItemSubItemObj.name + "</td>";
                                }
                            }

                        }
                    }
                    builtOutHTMLText += ("</tr>");
                }

                builtOutHTMLText += ("</table>");
                if(!this.isDisconnect){
                    this.template.querySelector('[data-id="manualRichText"]').innerHTML = builtOutHTMLText;
                }
                
                //this.myVal = builtOutHTMLText;
                this.didPreview = true;
                this.Loading = false;
                    //sendRccApex({ accountId:this.resp.Billing_Account__c, personEmail:emailVal, Accountnumber:this.resp.Billing_Account__r.AccountNumber, richTextBody: builtOutHTMLText, doCallFlow: false})
                    //console.log(builtOutHTMLText);
                
            })
        
    }
    get showSubmitButton(){
        return this.isCRISacc || this.didPreview;
    }
    get isDisconnect(){
        return (this.orderType == 'D' || (this.orderNumber && this.orderNumber.startsWith('D')))
    }
    accountValueChange(evt){
        console.log(evt);
        console.log(evt.target);
        if(this.initialAccNumBlank){
            if(evt && evt.target&& evt.target.value && evt.target.value.length >=10){
                this.isCRISacc = true;
            }else{
                this.isCRISacc = false;
            }
        }
    }
    completionDateChange(evt){
        this.completionDate = evt.target.value;    
    }
    disconnectDateChange(evt){
        this.disconnectDate = evt.target.value;
    }
    handleKeyDown(evt){
        var theEvent = evt || window.event;
        var key = theEvent.keyCode || theEvent.which;
        key = String.fromCharCode(key);
        var regex = /[]|\./;
        if(!regex.test(key)) {
            theEvent.returnValue = false;
            if(theEvent.preventDefault) theEvent.preventDefault();
        }
    }

    changingOrderVal(evt){
        this.orderNumber = evt.target.value;
    }

    get showVerbalAccept(){
        if(!this.orderNumber) return false;
        
        return (this.isCRISacc && this.orderNumber && !this.orderNumber.startsWith('N'));
    }
    sendRCC(){
        var richText;
        if(!this.acceptType){
            const evt = new ShowToastEvent({
                title: 'RCC Error',
                message: 'Accept type selection required',
                variant: 'error',
            });
            this.dispatchEvent(evt);
            return;
        }

        var dateReg = /^\d{2}[/]\d{2}[/]\d{4}$/

        if(this.isDisconnect){
            const completionDate = this.template.querySelector('[data-id="completionDate"]');
            if(!completionDate || !completionDate.value){
                const evt = new ShowToastEvent({
                    title: 'RCC Error',
                    message: 'Billed through date selection required for Disconnect orders',
                    variant: 'error',
                });
                this.dispatchEvent(evt);
                return;
            }
            else if(!completionDate.value.match(dateReg)){
                const evt = new ShowToastEvent({
                    title: 'RCC Error',
                    message: 'Billed through date has invalid format, required format is MM/DD/YYYY',
                    variant: 'error',
                });
                this.dispatchEvent(evt);
                return;
            }
            const disconnectDate = this.template.querySelector('[data-id="disconnectDate"]');
            if(!disconnectDate || !disconnectDate.value){
                const evt = new ShowToastEvent({
                    title: 'RCC Error',
                    message: 'Disconnect date selection required for Disconnect orders',
                    variant: 'error',
                });
                this.dispatchEvent(evt);
                return;
            }else if(!disconnectDate.match(dateReg)){
                const evt = new ShowToastEvent({
                    title: 'RCC Error',
                    message: 'Disconnect date has invalid format, required format is MM/DD/YYYY',
                    variant: 'error',
                });
                this.dispatchEvent(evt);
                return;
            }
        }
        if(this.isDisconnect){
            richText = this.template.querySelector('[data-id="disconnectHTML"]');
            console.log(richText);
        }
        else if(this.isCRISacc){
            richText = this.template.querySelector('[data-id="RichTextInput"]')
        }else{
            richText =this.template.querySelector('[data-id="manualRichText"]')
        }
        let emailVal = this.template.querySelector('[data-id="emailField"]');
        let orderVal = this.template.querySelector('[data-id="orderField"]');
        let saveAccountField = this.template.querySelector('[data-id="saveAccountField"]');
        let smsField = this.template.querySelector('[data-id="smsField"]');
        if(!orderVal || !orderVal.value){
            const evt = new ShowToastEvent({
                title: 'RCC Error',
                message: 'Order number required to send email for quote.',
                variant: 'error',
            });
            this.dispatchEvent(evt);
            return;
        }
        
        if(this.isCRISacc && this.showVerbalAccept){
            const acknowledgement = this.template.querySelector('[data-id="CRISacknowledgeStatement"]');
            console.log(acknowledgement);
            if(!acknowledgement || !acknowledgement.checked){
                const evt = new ShowToastEvent({
                    title: 'RCC Error',
                    message: 'CRIS acknowledgement message required.',
                    variant: 'error',
                });
                this.dispatchEvent(evt);
                return;
            }
        }
        if(!richText || (!richText.value && !richText.innerHTML)){
            const evt = new ShowToastEvent({
                title: 'RCC Error',
                message: 'The RCC email must include an attached quote.',
                variant: 'error',
            });
            this.dispatchEvent(evt);
            return;
        }
        if(this.isEmailSelected){
            if(!emailVal || !emailVal.value){
                const evt = new ShowToastEvent({
                    title: 'RCC Error',
                    message: 'Email is required.',
                    variant: 'error',
                });
                this.dispatchEvent(evt);
                return;
            }
            if(window && window.location && window.location.origin && window.location.origin.includes('--')){
                
                if(!this.canSendTestEmails && 
                    !emailVal.value.toLowerCase().includes('@centurylink') && 
                    !emailVal.value.toLowerCase().includes('@lumen')){
                        const evt = new ShowToastEvent({
                            title: 'RCC Error',
                            message: 'User not enabled for sending to non CTL/Lumen addresses in test.',
                            variant: 'error',
                        });
                        this.dispatchEvent(evt);
                        return;
                    }
            }
            emailVal = emailVal.value;
        }else if(this.isSMSSelected){
            if(!smsField || !smsField.value){
                const evt = new ShowToastEvent({
                    title: 'RCC Error',
                    message: 'SMS number is required.',
                    variant: 'error',
                });
                this.dispatchEvent(evt);
                return;
            }
            smsField = smsField.value;
            const savedSMS = smsField.replace(/\D/g,'');
            if(!savedSMS || (savedSMS && !(savedSMS.length == 10 || savedSMS.length == 11))){
                const evt = new ShowToastEvent({
                    title: 'RCC Error',
                    message: '10 or 11 character SMS number is required.',
                    variant: 'error',
                });
                this.dispatchEvent(evt);
                return;
            }
            const acknowledgementSMS = this.template.querySelector('[data-id="SMSacknowledgeStatement"]');
            if(!acknowledgementSMS || !acknowledgementSMS.checked){
                const evt = new ShowToastEvent({
                    title: 'RCC Error',
                    message: 'SMS acknowledgement message required.',
                    variant: 'error',
                });
                this.dispatchEvent(evt);
                return;
            }
        }
        richText = richText.value ? richText.value : richText.innerHTML;
        
        sendRccApex({ accountId:this.resp.Id, 
                        personEmail:emailVal, 
                        orderNumber: orderVal.value, 
                        Accountnumber:this.resp.AccountNumber, 
                        richTextBody: richText,  
                        updateAccount:saveAccountField? saveAccountField.checked: false, 
                        SMSNumber:smsField, 
                        acceptType:this.acceptType,
                        orderTypeDisconnect: this.isDisconnect,
                        isSmbFlow: false})
				.then(commId=>{	
                    if(commId){	
                        console.log(commId);	
                        ConsoleApiBridge.callMethod({	
                            name: "getEnclosingTabId",	
                            apiType: "workspace"	
                          }).then(tabId => {	
                            ConsoleApiBridge.callMethod({	
                              name: "openSubtab",	
                              apiType: "workspace",	
                              parametersObject: {	
                                parentTabId: tabId,	
                                  recordId: commId,	
                                  focus:false	
                              }	
                            });	
                          });	
                    }	
                    	
                });
                if(this.isEmailSelected){
                    const evt = new ShowToastEvent({
                        title: 'RCC Sent',
                        message: 'Email message was sent to '+emailVal,
                        variant: 'success',
                    });
                    this.dispatchEvent(evt);
                }else if(this.isSMSSelected){
                    const evt = new ShowToastEvent({
                        title: 'RCC Sent',
                        message: 'SMS message was sent to '+smsField,
                        variant: 'success',
                    });
                    this.dispatchEvent(evt);
                }else{
                    const evt = new ShowToastEvent({
                        title: 'RCC Sent',
                        message: 'Verbal acceptance was saved',
                        variant: 'success',
                    });
                    this.dispatchEvent(evt);
                }
                
                this.closeModal();
        
        
    }

    get getCurrentSaveLabel(){
        if(this.isEmailSelected){
            return 'Save as account email';
        }else{
            return 'Save as account mobile number';
        }
    }

    get options() {
        if(this.canSendSMS){
            return [
                { label: 'Email', value: 'Email' },
                { label: 'SMS', value: 'SMS' },
                { label: 'Verbal', value: 'Verbal' }
            ];
        }else{
            this.acceptType = 'Email';
            return [
                { label: 'Email', value: 'Email' }
            ]
        }
        
    }
}