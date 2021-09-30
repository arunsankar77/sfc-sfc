({
    handleSelect : function(component, event, helper) {
        var selectedButton = event.getParam("value");
        switch(selectedButton) {
            case "NewServiceAddress": helper.handleNewServiceAddress(component); break;
            case "C2C": helper.handleC2C(component); break;
            case "UpdatetoTemporaryNoTreat": helper.handleUpdatetoTemporaryNoTreat(component); break;
        }
    }
})