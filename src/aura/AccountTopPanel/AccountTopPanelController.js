({
    toggleAction : function(component, event, helper) {
        var mainPanel = component.find("mainPanel");
        $A.util.toggleClass(mainPanel, 'slds-show');  
        $A.util.toggleClass(mainPanel, 'slds-hide');
        component.set("v.collapsableIcon", component.get("v.collapsableIcon")=="utility:up"? "utility:down":"utility:up");
    }
})