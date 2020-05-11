
/**
 * Description - Create grid
 * @param elementId
 * @param data
 * @param columns
 * @param options
 * @param tabid
 * @constructor
 */
function CreateGrid(elementId, data, columns, options, tabid) {
    if (!gridArray) {
        gridArray = [];
    }
    var grid = new Slick.Grid("#" + elementId, data, columns, options);
    attachAutoResizeDataGrid(grid, "myGrid" + tabid, "gridContainer");
    columnpicker = new Slick.Controls.ColumnPicker(columns, grid, options);
    grid.setSelectionModel(new Slick.RowSelectionModel({selectActiveRow: false}));
    grid.registerPlugin(new Slick.AutoTooltips({enableForHeaderCells: true}));
    grid.registerPlugin(checkboxSelector);


    /**
     * Grid row reorder
     */

    grid.setSelectionModel(new Slick.RowSelectionModel());

    var moveRowsPlugin = new Slick.RowMoveManager({
        cancelEditOnDrag: true
    });
    moveRowsPlugin.onBeforeMoveRows.subscribe(function (e, data) {
        for (var i = 0; i < data.rows.length; i++) {
            // no point in moving before or after itself
            if (data.rows[i] == data.insertBefore || data.rows[i] == data.insertBefore - 1) {
                e.stopPropagation();
                return false;
            }
        }
        return true;
    });
    moveRowsPlugin.onMoveRows.subscribe(function (e, args) {
        var extractedRows = [],
            left, right;
        var rows = args.rows;
        var insertBefore = args.insertBefore;
        //condition to check whether grid row is at zero 0th level
        if (insertBefore === 0 || args.rows === 0) {
            addAlert("alert alert-warning", "", "you are trying to move first row");
        } else {
            left = data.slice(0, insertBefore);
            right = data.slice(insertBefore, data.length);
            rows.sort(function (a, b) {
                return a - b;
            });
            for (var i = 0; i < rows.length; i++) {
                extractedRows.push(data[rows[i]]);
            }
            rows.reverse();
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                if (row < insertBefore) {
                    left.splice(row, 1);
                } else {
                    right.splice(row - insertBefore, 1);
                }
            }
            data = left.concat(extractedRows.concat(right));
            var selectedRows = [];
            for (var i = 0; i < rows.length; i++) {
                selectedRows.push(left.length + i);
            }
            // alert("From > " + (row+1) + "To > " + (insertBefore));
            rowreorderupdateajax(row + 1, insertBefore);
            grid.resetActiveCell();
            grid.setData(data);
            grid.setSelectedRows(selectedRows);
            grid.render();
        } // closing else
    });
    grid.registerPlugin(moveRowsPlugin);


    /**
     *  Description - Context menu onclick event on grid
     */
    var contextrowid = 0;
    grid.onContextMenu.subscribe(function (e) {
        e.preventDefault();
        var cell = grid.getCellFromEvent(e);
        jQuery("#contextMenu")
            .data("row", cell.row)
            .css("top", (e.pageY) - 40)
            .css("left", e.pageX)
            .show();

        contextrowid = cell.row;

        jQuery("body").one("click", function () {
            jQuery("#contextMenu").hide();
        });
    });


    /**
     * Description - On context menu event select
     */

    jQuery("#contextMenu").click(function (e) {
        if (jQuery(e.target).is("li")) {
            e.preventDefault();
            //console.log(jQuery(e.target).attr("data"));
            switch (jQuery(e.target).attr("data")) {
                case "ADD":
                    // code block
                    break;
                case "DELETE":
                    var griddata = data;
                    var event = "DELETE";
                    var current_row = getSelectedRow();

                    griddata.splice(current_row, 1);
                    var row = current_row;
                    while (row < griddata.length) {
                        grid.invalidateRow(row);
                        row++;
                    }
                    grid.updateRowCount();
                    grid.render();
                    grid.scrollRowIntoView(current_row - 1);
                    //ajax call to post

                    contextmenuajaxcall(current_row, event, tabid);
                    // jQuery("#overlay").hide();
                    addAlert("alert alert-info", "", "Test step " + (current_row + 1) + " deleted successfully");

                    break;


                case "REFRESH":
                    baseurl = jQuery('input[title="baseURL"]').val();
                    PrjectName = getPrjectName();
                    jQuery("#overlay").show();
                    var dataString = "tabnumber=" + gettabid() +
                        "&EnterURL=" + document.getElementById("EnterURL").value ;
                    jQuery.getJSON(baseurl + renderurl + "?" + dataString, {tabnumber: tabid}, function (data) {
                        grid = CreateSlick(data, columns, options, tabid);
                    });
                    jQuery("#overlay").hide();
                    addAlert("alert alert-info", "", "Test case refreshed!");
                    break;

            }
        }
    });

    /**
     * multi select row
     * @type {boolean}
     */

    // grid.onClick.subscribe(function (e,args) {
    //     //     if(selectActiveRow){
    //     //         if($.inArray(args.row, selectedRows) === -1){
    //     //             selectedRows = [];
    //     //             selectedRows.push(args.row)
    //     //         }else{
    //     //             selectedRows = [];
    //     //         }
    //     //     }else{
    //     //         ($.inArray(args.row, selectedRows) === -1) ? selectedRows.push(args.row) : selectedRows.splice(selectedRows.indexOf(args.row), 1);
    //     //     }
    //     //     grid.setSelectedRows(selectedRows);
    //     //
    //     // });


    grid.onClick.subscribe(function (e, args) {
        jQuery('#delete').prop('disabled', false);
        jQuery('#add').prop('disabled', false);
        selectActiveRow = false;
        grid.setSelectionModel(new Slick.RowSelectionModel({
            selectActiveRow: false
        }));
        // console.log(args.row);
        grid.setSelectedRows(args.row);
        setSelectedRow(args.row);
    });


    // jQuery(document).keydown(function (e) {
    //     if (e.shiftKey) {
    //         selectActiveRow = false;
    //         grid.setSelectionModel(new Slick.RowSelectionModel({
    //             selectActiveRow: false
    //         }));
    //         addAlert("alert alert-info", "", "Multi-row selection is enabled, hit escape key to release");
    //     }else if(e.key === "Escape" || e.which === 27) {
    //         grid.setSelectedRows([]);
    //         selectActiveRow = true;
    //         grid.setSelectionModel(new Slick.RowSelectionModel({
    //             selectActiveRow: true
    //         }));
    //         addAlert("alert alert-info", "", "Multi-row selection is disabled");
    //     }
    // });



    // jQuery("#deleterows").click(function() {
    //
    //     var str="";
    //     var selected = grid.getSelectedRows();
    //     grid.setSelectedRows([]);
    //     $.each(selected, function (index, value) {
    //         str+=value+1+',';
    //     });
    //
    //     var rowstodelete = str.split(',');
    //     rowstodelete = rowstodelete.slice(0, -1);
    //
    //     console.log("rowstodelete " + rowstodelete);
    //
    //     path = getPath();
    //     TestCaseId = gettestcaseId();
    //     testcasename = gettestcasename();
    //     PrjectName = getPrjectName();
    //     contextrowid = 1;
    //     var dataString = "contextmenuevent=" + "DELETEROWS" +
    //         "&contextrowid=" + contextrowid +
    //         "&rowstodelete=" + rowstodelete +
    //         "&tabid=" + tabid +
    //         "&path=" + Path;
    //     baseurl = jQuery('input[title="baseURL"]').val();
    //     jQuery('.overlay').show();
    //
    //     $.ajax({
    //         type: "POST",
    //         url: baseurl + contextservleturl + "?" + dataString,
    //         dataType: "text",
    //         success: function (data) {
    //             jQuery("#codegenie").html(data);
    //             var block = document.getElementById('codegenie');
    //             Prism.highlightElement(block);
    //             jQuery('.overlay').hide();
    //             jQuery.getJSON(baseurl + renderurl + "?" + dataString, {tabnumber: tabID }, function (data) {
    //                 grid.setData(data);
    //                 grid.render();
    //                 attachAutoResizeDataGrid(grid, "myGrid" + tabID, "gridContainer");
    //             });
    //         }
    //     });
    //
    //     grid.invalidate();
    // });


    /**
     * Desscription - Select row on click
     */
    // grid.onClick.subscribe(function (e, args) {
    //     jQuery('#delete').prop('disabled', false);
    //     jQuery('#add').prop('disabled', false);
    //     selectActiveRow = true;
    //     grid.setSelectionModel(new Slick.RowSelectionModel({
    //         selectActiveRow: true
    //     }));
    //     // console.log(args.row);
    //     grid.setSelectedRows(args.row);
    //     setSelectedRow(args.row);
    // });


    /* On mouse change on grid */
    grid.onMouseEnter.subscribe(function (e, args) {
        var cell = grid.getCellFromEvent(e),
            param = {},
            columnCss = {};
        for (var index in columns) {
            var id = columns[index].id;
            columnCss[id] = 'my_highlighter_style'
        }
        param[cell.row] = columnCss;
        args.grid.setCellCssStyles("row_highlighter", param);
    });


    /* on grid cell change with keypress enter and tab key */
    grid.onKeyDown.subscribe(function (e, args) {
        if (e.keyCode === 13 || e.keyCode === 9) {
            if (grid.getColumns()[args.cell].name === "User Value") {
                //console.log("on keydown " + grid.getColumns()[args.cell].name);
                onuservaluedatachange(e, args);
            }
            // else {
                //console.log("on keydown " + grid.getColumns()[args.cell].name);
                // onothercelldatachange(e, args);
            // }
        }
    });


    /**
     *  On keydown send out uservalue on time interval of 1000ms
     */
    //setup before functions
    //     var typingTimer;                //timer identifier
    //     var doneTypingInterval = 1000;  //time in ms, 5 second for example
    //
    //     grid.onKeyDown.subscribe(function(e, args) {
    //
    //         var value = data[args.row][grid.getColumns()[args.cell].field];
    //         if (grid.getColumns()[args.cell].name === "UserValue"){
    //             clearTimeout(typingTimer);
    //             if (jQuery('input[name=fname]').val) {
    //                 typingTimer = setTimeout(function(){
    //                     onuservaluedatachange(e, args)
    //                 }, doneTypingInterval);
    //             }
    //         }else{
    //             onothercelldatachange(e, args);
    //         }
    //
    //     });

    /* on grid cell change function*/
    grid.onCellChange.subscribe(function (e, args) {
        // var value = data[args.row][grid.getColumns()[args.cell].field];
        if (grid.getColumns()[args.cell].name === "User Value") {
            //console.log("on cell change " + grid.getColumns()[args.cell].name);
            onuservaluedatachange(e, args);
        } else {
            //console.log("on cell change " + grid.getColumns()[args.cell].name);
            onothercelldatachange(e, args);
        }
    });

    /**
     * Description - Update grid row reorder function
     * @param rowto
     * @param rowfrom
     */
    function rowreorderupdateajax(rowto, rowfrom) {
        path = getPath();
        testcasename = gettestcasename();
        TestCaseId = gettestcaseId();
        tabid = gettabid();
        PrjectName = getPrjectName();
        var defaultenteredurl = document.getElementById("EnterURL").value;
        //baseurl = jQuery('input[title="baseURL"]').val();
        var dataString =
            // "useraction="+ "gridrowupdate"
            "rowto=" + rowto +
            "&rowfrom=" + rowfrom +
            "&tabnumber=" + gettabid() +
            "&path=" + Path;
        jQuery('.overlay').show();

        // var value = data[args.row][grid.getColumns()[args.cell].field];
        // if (grid.getColumns()[args.cell].name === "User Value") {
        //     value = jQuery("#Uservalue" + tabid + "" + args.row + "" + args.cell).val();
        // }

        $.ajax({
            type: "PUT",
            url: baseurl + gridservleturl + "?" + dataString,
            dataType: "text",
            content: "text/plain",

            success: function (callbackresponse) {
                jQuery("#codegenie").html(callbackresponse);
                var block = document.getElementById('codegenie');
                Prism.highlightElement(block);
                jQuery("#EnterURL").val(defaultenteredurl);
                jQuery.getJSON(baseurl + renderurl + "?" + dataString, {tabnumber: tabID }, function (data) {

                    // grid = CreateSlick(data, columns, options, tabID);
                    attachAutoResizeDataGrid(grid, "myGrid" + tabID, "gridContainer");
                    grid.setData(data);
                    grid.render();
                });

                jQuery('.overlay').hide();
                addAlert("alert alert-success", "Yey!", "Test Case is successfully Updated, Click on Save button.");
            }
            ,
            error: function () {
                jQuery("#output").text("Abort Failed");
                document.getElementById("CreateRepo").disabled = true;
                document.getElementById("compile").disabled = true;

                //add alert message on failure
                addAlert("alert alert-danger", "Oops!", "Something went wrong");
            },
        }).done(function () {

            //     grid.resetActiveCell();
            //     grid.setData(data);
            //     grid.invalidateAllRows();
            //     grid.updateRowCount();
            // //     grid.render();



        });
    }



    /**
     * Description - Function call on change in uservalue data
     * @param e
     * @param args
     */
    function onuservaluedatachange(e, args) {
        // var changes = {};
        // var item = args.item;
        data = grid.getData();
        path = getPath();
        testcasename = gettestcasename();
        TestCaseId = gettestcaseId();

        var value = data[args.row][grid.getColumns()[args.cell].field];
        if (grid.getColumns()[args.cell].name === "User Value") {
            value = jQuery("#Uservalue" + gettabid() + "" + args.row + "" + args.cell).val();
        }

        if (value !== "") {
            // var rowidforfirstcolumn = data[args.row][grid.getColumns()[2].field];
            var rowidforfirstcolumn = data[args.row]["TAG_TestStepId"];
            var name = grid.getColumns()[args.cell].name;
            console.log(name);
            // var useractionvalue = data[args.row][grid.getColumns()[17].field];
            var useractionvalue = data[args.row]["TAG_EL_ByUserAction"];

            baseurl = jQuery('input[title="baseURL"]').val();
            PrjectName = getPrjectName();
            var dataString = "columnname=" +
                "uservalue" +
                "&row=" + rowidforfirstcolumn +
                "&useraction=" + useractionvalue +
                "&name=" + name +
                "&value=" + value +
                "&tabnumber=" + gettabid() +
                "&ProjectName=" + PrjectName;

            jQuery('.overlay').show();
            $.ajax({
                type: "PUT",
                url: baseurl + renderurl + "?" + dataString,
                content: "text/plain",
                success: function (callbackresponse) {
                    // jQuery("#Uservalue" + tabid + "" + args.row + "" + args.cell).val(value);
                    jQuery("#codegenie").html(callbackresponse);
                    var block = document.getElementById('codegenie');
                    Prism.highlightElement(block);
                    jQuery.getJSON(baseurl + renderurl + "?" + dataString, {tabnumber: gettabid() }, function (data) {
                        grid.setData(data);
                        grid.render();
                        var UserValuecolumn = 18;
                        var datalength = data.length;

                        for(var i=1; i < datalength; i++){
                            rowidforfirstcolumn = i;
                            var itabid = gettabid();
                            var id = "Uservalue" + itabid + "" + (rowidforfirstcolumn -1) + "" + UserValuecolumn;
                            var aid = itabid + "" + (rowidforfirstcolumn -1)  + "" + UserValuecolumn;
                            var testrowid = (rowidforfirstcolumn -1) ;

                            var useractiontag = data[testrowid]['TAG_EL_ByUserAction'];
                            switch (useractiontag){
                                case "Set":
                                // case "WaitandFindAlert":
                                    // jQuery("#"+id).prop('disabled', false);
                                    // jQuery("#"+aid).prop('disabled', false);
                                    // jQuery("#img"+aid).prop('disabled', false);
                                    // jQuery("#"+aid).attr("class","myBtn");
                                    // jQuery("#"+aid).attr("href","#");
                                    jQuery("#"+id).val(data[testrowid]['TAG_EL_ByUserValue']);
                                    //jQuery("#img"+aid).attr("src","/jira/download/resources/com.testautomatic.plugin.TAPlugin:resources/images/share.svg");
                                    jQuery("#img"+aid).attr("src",baseurl+shareimagelocation);
                                    break;

                                case "SetSecure":
                                    // jQuery("#"+id).prop('disabled', false);
                                    // jQuery("#"+aid).prop('disabled', false);
                                    // jQuery("#img"+aid).prop('disabled', false);
                                    // jQuery("#"+aid).attr("class","myBtn");
                                    // jQuery("#"+aid).attr("href","#");
                                    // jQuery("#"+id).attr("type","password");
                                    jQuery("#"+id).val(data[testrowid]['TAG_EL_ByUserValue']);
                                    //jQuery("#img"+aid).attr("src","/jira/download/resources/com.testautomatic.plugin.TAPlugin:resources/images/share.svg");
                                    jQuery("#img"+aid).attr("src",baseurl+shareimagelocation);
                                    break;

                                default:
                                    break;

                            }
                        }


                    });


                    //grid.invalidateAllRows();
                    grid.flashCell(rowidforfirstcolumn - 1, args.cell, 200);
                    grid.render();
                    attachAutoResizeDataGrid(grid, "myGrid" + tabID, "gridContainer");
                    jQuery(".overlay").hide();
                    //jQuery("#Uservalue" + tabid + "" + args.row + "" + args.cell).val(value);
                }
            });

            // jQuery("#Uservalue" + tabid + "" + args.row + "" + args.cell).val(value);
            //     .done(function () {
            //     // baseurl = jQuery('input[title="baseURL"]').val();
            //     // jQuery.getJSON(baseurl + renderurl + "?" + dataString, {tabnumber: tabid}, function (data) {
            //     //     grid = CreateSlick(data, columns, options, tabid);
            //     // });
            // });
            // grid.invalidateAllRows();
            // grid.flashCell(rowidforfirstcolumn - 1, args.cell, 200);
            // grid.updateRowCount();
            // grid.render();
            addAlert("alert alert-info", "", "User Value has been set");

        } else {
            //do nothing
        }
    }


    /**
     * Description - Function call on change in cell value other than uservalue
     * @param e
     * @param args
     */
    function onothercelldatachange(e, args) {
        data = grid.getData();

        var value = data[args.row][grid.getColumns()[args.cell].field];
        // var id = args.item.id;
        // var rowidforfirstcolumn = data[args.row][grid.getColumns()[2].field];
        var rowidforfirstcolumn = data[args.row]["TAG_TestStepId"];
        //var UserValuecolumn = 18;
        var name = grid.getColumns()[args.cell].name;
        // var useractionvalue = data[args.row][grid.getColumns()[17].field];
        var useractionvalue = data[args.row]["TAG_EL_ByUserAction"];
        path = getPath();
        baseurl = jQuery('input[title="baseURL"]').val();
        testcasename = gettestcasename();
        TestCaseId = gettestcaseId();
        PrjectName = getPrjectName();
        var dataString = "columnname=" +
            "others" +
            "&row=" + rowidforfirstcolumn  ;

        jQuery(".overlay").show();
        $.ajax({
            type: "PUT",
            url: baseurl + renderurl + "?" + dataString,
            dataType: "text",
            content: "text/plain",
            success: function (callbackresponse) {
                jQuery("#codegenie").html(callbackresponse);
                var block = document.getElementById('codegenie');
                Prism.highlightElement(block);
                jQuery.getJSON(baseurl + renderurl + "?" + dataString, {tabnumber: gettabid() }, function (dataContext) {
                    var UserValuecolumn = 18;
                    var itabid = gettabid();
                    var id = "Uservalue" + itabid + "" + (rowidforfirstcolumn -1) + "" + UserValuecolumn;
                    var aid = itabid + "" + (rowidforfirstcolumn -1)  + "" + UserValuecolumn;
                    var testrowid = (rowidforfirstcolumn -1) ;

                    var useractiontag = dataContext[testrowid]['TAG_EL_ByUserAction'];
                    switch (useractiontag){
                        case "Set":
                
                            jQuery("#"+id).prop('disabled', false);
                            jQuery("#"+aid).prop('disabled', false);
                            jQuery("#img"+aid).prop('disabled', false);
                            jQuery("#"+aid).attr("class","myBtn");
                            jQuery("#"+aid).attr("href","#");
                            jQuery("#"+id).attr("type","text");
                            //jQuery("#img"+aid).attr("src","/jira/download/resources/com.testautomatic.plugin.TAPlugin:resources/images/share.svg");
                            jQuery("#img"+aid).attr("src",baseurl+shareimagelocation);
                            break;

                        case "SetSecure":
                            jQuery("#"+id).prop('disabled', false);
                            jQuery("#"+aid).prop('disabled', false);
                            jQuery("#img"+aid).prop('disabled', false);
                            jQuery("#"+aid).attr("class","myBtn");
                            jQuery("#"+aid).attr("href","#");
                            jQuery("#"+id).attr("type","password");
                            //jQuery("#img"+aid).attr("src","/jira/download/resources/com.testautomatic.plugin.TAPlugin:resources/images/share.svg");
                            jQuery("#img"+aid).attr("src",baseurl+shareimagelocation);
                            break;

                        default:
                            break;

                    }
                    //}
                });
                jQuery(".overlay").hide();
            }
        }).done(function () {
        });

        grid.flashCell(rowidforfirstcolumn - 1, args.cell, 200);
        grid.render();
        addAlert("alert alert-info", "", "Test Step " + rowidforfirstcolumn + " updated");

    }

    /**
     * Description - delete row
     */
    jQuery(document).on('click', '#delete', function () {
        var str="";
        var selected = grid.getSelectedRows();
        grid.setSelectedRows([]);
        $.each(selected, function (index, value) {
            str+=value+1+',';
        });

        var rowstodelete = str.split(',');
        rowstodelete = rowstodelete.slice(0, -1);

        if(rowstodelete.length === 0) {
            addAlert("alert alert-warning", "", "Select test step to delete.");
        }else{
            path = getPath();
            contextrowid = 1;
            rowstodelete.sort(function (a, b) {
                return a - b
            });
            var dataString = "contextmenuevent=" + "DELETEROWS" +
              
                "&path=" + Path;
            baseurl = jQuery('input[title="baseURL"]').val();
            jQuery('.overlay').show();
            $.ajax({
                type: "POST",
                url: baseurl + contextservleturl + "?" + dataString,
                dataType: "text",
                success: function (data) {
                    jQuery("#codegenie").html(data);
                    var block = document.getElementById('codegenie');
                    Prism.highlightElement(block);
                    jQuery.getJSON(baseurl + renderurl + "?" + dataString, {tabnumber: gettabid()}, function (data) {
                        grid.setData(data);
                        grid.render();
                        attachAutoResizeDataGrid(grid, "myGrid" + tabID, "gridContainer");
                    });
                    jQuery('.overlay').hide();
                }
            });

            grid.invalidate();
            addAlert("alert alert-info", "", "Test step " + (rowstodelete) + " deleted successfully");
        }
    });

    /**
     * Description - Refresh grid
     */
    jQuery('#refresh').click(function (e) {
        PrjectName = getPrjectName();
        var rowidforfirstcolumn;
        //var UserValuecolumn = 18;

        var dataString = "tabnumber=" + gettabid() +
            "&EnterURL=" + document.getElementById("EnterURL").value +
 "&path=" + Path;
        baseurl = jQuery('input[title="baseURL"]').val();
        jQuery("#overlay").show();
        jQuery.getJSON(baseurl + renderurl + "?" + dataString, {tabnumber:gettabid()}, function (data) {
            var datalength = data.length;
            var UserValuecolumn = 18;
            grid.setData(data);
            grid.render();
            for(var i=1; i < datalength; i++){
                rowidforfirstcolumn = i;
                var itabid = gettabid();
                var id = "Uservalue" + itabid + "" + (rowidforfirstcolumn -1) + "" + UserValuecolumn;
                var aid = itabid + "" + (rowidforfirstcolumn -1)  + "" + UserValuecolumn;
                var testrowid = (rowidforfirstcolumn -1) ;

                var useractiontag = data[testrowid]['TAG_EL_ByUserAction'];
                switch (useractiontag){
                    case "Set":
                    
                    // case "WaitandFindAlert":
                        jQuery("#"+id).prop('disabled', false);
                        jQuery("#"+aid).prop('disabled', false);
                        jQuery("#img"+aid).prop('disabled', false);
                        jQuery("#"+aid).attr("class","myBtn");
                        jQuery("#"+aid).attr("href","#");
                        jQuery("#"+id).attr("type","text");
                        //jQuery("#img"+aid).attr("src","/jira/download/resources/com.testautomatic.plugin.TAPlugin:resources/images/share.svg");
                        jQuery("#img"+aid).attr("src",baseurl+shareimagelocation);
                        break;

                    case "SetSecure":
                        jQuery("#"+id).prop('disabled', false);
                        jQuery("#"+aid).prop('disabled', false);
                        jQuery("#img"+aid).prop('disabled', false);
                        jQuery("#"+aid).attr("class","myBtn");
                        jQuery("#"+aid).attr("href","#");
                        jQuery("#"+id).attr("type","password");
                        //jQuery("#img"+aid).attr("src","/jira/download/resources/com.testautomatic.plugin.TAPlugin:resources/images/share.svg");
                        jQuery("#img"+aid).attr("src",baseurl+shareimagelocation);
                        break;

                    default:
                        break;

                }
            }
        });
    });

    /**
     * Description - add row in grid
     */
    jQuery('#add').click(function (e) {
        data = grid.getData();
        var currRowNum = grid.getActiveCell().row;
        var newrowposition = currRowNum + 1;
        var newrowdata = jQuery.extend({}, data[newrowposition]);
        //console.log(currRowNum);
        //console.log(newrowposition);
        newrowdata.TAG_TestStepDescription = '';
        newrowdata.TAG_TestExpectedResult = '';
        newrowdata.TAG_EL_Tag = '';
        newrowdata.TAG_EL_Type = '';
        newrowdata.TAG_EL_ByName = '';
        newrowdata.TAG_EL_ByXpath = '';
        newrowdata.TAG_EL_ById = '';
        newrowdata.TAG_EL_ByClass = '';
        newrowdata.TAG_EL_BylinkText = '';
        newrowdata.TAG_EL_byLinkHref = '';
        newrowdata.TAG_EL_ByCssSelector = '';
        newrowdata.TAG_Key = '';
        newrowdata.TAG_Key_Value = '';
        newrowdata.TAG_EL_ByUserAction = '';
        //position idx where new row would be added

        data.splice(newrowposition, 0, newrowdata);
        grid.setData(data);
        grid.render();

        var dataString = "contextmenuevent=" + "ADD" +
            "&contextrowid=" + newrowposition +
            "&tabid=" + gettabid() +
            "&path=" + getPath();

        baseurl = jQuery('input[title="baseURL"]').val();
        jQuery('.overlay').show();

        $.ajax({
            type: "POST",
            url: baseurl + contextservleturl + "?" + dataString,
            dataType: "text",
            success: function (callbackresponse) {
                jQuery("#codegenie").html(callbackresponse);
                var block = document.getElementById('codegenie');
                Prism.highlightElement(block);

                var refreshdataString = "tabnumber=" + gettabid() +
                    "&EnterURL=" + document.getElementById("EnterURL").value +
                "&path=" + Path;
                jQuery.getJSON(baseurl + renderurl + "?" + refreshdataString, {tabnumber: gettabid()}, function (data) {
                    grid.setData(data);
                    grid.render();
                    attachAutoResizeDataGrid(grid, "myGrid" + tabID, "gridContainer");

                });

                jQuery('.overlay').hide();
            }
        });
    });




    /**
     * Description - Context menu event call
     * @param contextrowid
     * @param event
     * @param tabid
     */
    function contextmenuajaxcall(contextrowid, event, tabid) {

        path = getPath();
        
        var dataString = "contextmenuevent=" + event +
            "&contextrowid=" + contextrowid +
            "&tabid=" + tabid +
            "&path=" + Path;
        baseurl = jQuery('input[title="baseURL"]').val();
        jQuery('.overlay').show();

        $.ajax({
            type: "POST",
            url: baseurl + contextservleturl + "?" + dataString,
            dataType: "text",
            success: function (callbackresponse) {
                jQuery("#codegenie").html(callbackresponse);
                var block = document.getElementById('codegenie');
                Prism.highlightElement(block);
                jQuery('.overlay').hide();
                jQuery.getJSON(baseurl + renderurl + "?" + dataString, {tabnumber: tabID }, function (data) {

                    // grid = CreateSlick(data, columns, options, tabID);

                    grid.setData(data);

                    grid.render();
                    attachAutoResizeDataGrid(grid, "myGrid" + tabID, "gridContainer");
                });
            }
        });


        // .done(function(){
        //     jQuery.getJSON(serverurl, {tabnumber:tabid}, function (data) {
        //         grid = CreateSlick(data, columns, options, tabid);
        //     });
        // });

    }

}


/**
 * Description - To dynamically create slickgrid based on tabid
 * @param data
 * @param columns
 * @param options
 * @param tabid
 * @constructor
 */
function CreateSlick(data, columns, options, tabid) {
    CreateGrid("myGrid" + tabid, data, columns, options, tabid);
}



/**
 * convert row data to Hierarchy
 * @param rows
 * @returns {Array}
 */
function convert(rows) {
    function exists(rows, parentId) {
        for (var i = 0; i < rows.length; i++) {
            if (rows[i].id === parentId) return true;
        }
        return false;
    }

    var nodes = [];
    // get the top level nodes
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        if (!exists(rows, row.parentId)) {
            nodes.push({
                id: row.id,
                text: row.name,
                iconCls: row.iconCls
            });
        }
    }

    var toDo = [];
    for (var i = 0; i < nodes.length; i++) {
        toDo.push(nodes[i]);
    }
    while (toDo.length) {
        var node = toDo.shift(); // the parent node
        // get the children nodes
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            if (row.parentId === node.id) {
                var child = {
                    id: row.id,
                    text: row.name,
                    iconCls: row.iconCls
                };
                if (node.children) {
                    node.children.push(child);
                } else {
                    node.children = [child];
                }
                toDo.push(child);
            }
        }
    }
    return nodes;
}



function amendcall(TestCaseId ,testcasename ) {
    // alert(TestCaseId);
    // var selectedtestfolder = jQuery('#tt').tree('getSelected').id;
    // var selectedtestfoldername = jQuery('#tt').tree('getSelected').text;
    jQuery("#overlay").show();
    baseurl = jQuery('input[title="baseURL"]').val();
    //var path = getPath(node.target);
    // var action = "ADDFOLDER";

    // alert(selectedtestfolder);
    // // settestcaseId(72);
    // TestCaseId = gettestcaseId();

    var dataString = "urlreader=" +
        "" + "&TestCaseId=" +  TestCaseId +
        "&tabnumber=" + gettabid() +
        "&rowto=0" +
        "&rowfrom=0" ;
    // alert(dataString);
    $.ajax({
        type: "POST",
        url: baseurl + amendservleturl + "?" + dataString , //baseurl + TestManagementURL + "?" + addfolderString,
        content: "text/plain",
        success: function (CodeResponseText) {

            var data = JSON.parse(CodeResponseText);
            //
            // var dataResponse = JSON.parse(CodeResponseText);
            // var dataSize = dataResponse.length  - 1 ;
            // var data = dataResponse[dataSize];

            settestcaseId(data.testcaseId);
            settabid(data.tabCount);
            var AmendTestCaseId = data.testcaseId ;
            var AmendTabCount = data.tabCount;

            var itab = 1 ;


                var dataString = "TestCaseId=" + AmendTestCaseId +
                    "&tabnumber=" + itab ;


                jQuery.getJSON(baseurl + renderurl ,  dataString,  function (data1) {

                    // grid.setData(data);
                    // grid.render();
                    // attachAutoResizeDataGrid(grid, "myGrid" + tabID, "gridContainer");
                    //
                    grid = CreateSlick(data1, columns, options, data1[0].TAG_TAB);
                    if ( AmendTabCount > 1 ) {
                        createGridTab(AmendTestCaseId, getPath(), testcasename, getShwlink(), itab + 1, defaultenteredurl, AmendTabCount );
                    }
                    // grid.render();
                    // attachAutoResizeDataGrid(grid, "myGrid" + tabID, "gridContainer");
                });



            //   alert ( baseurl + renderurl + "?" + dataString);
            // default user entered url
            jQuery("#overlay").hide();
            // activatebuttons();
            // setFileUploadHistory(PrjectName);
            //add alert message on success
            addAlert("alert alert-success", "Hooray!", "Test Case is generated, Click on Save button.");
            activatebuttons();
        },
        error: function () {
            jQuery('#teststatusFailure').text("* Something went wrong, try again!");
        }
    });

}


function createGridTab(AmendTestCaseId, getPath , testcasename , getShwlink , itab , defaultenteredurl , AmendTabCount) {

    var dataString = 
        "tabnumber=" + itab +
        "&urlreader=" +
        defaultenteredurl ;

    settabid(itab);
    jQuery('#tab-list').append(jQuery('<li id="#tab' + tabID + '"><a href="#tab' + tabID + '" role="tab" value = "'+tabID+'" name="myGrid' + tabID + '" data-toggle="tab">Tab ' + tabID + '<button class="close" type="button" title="Remove this' +
        ' page">&times</button></a></li>'));
    jQuery('#tab-content').append(jQuery('<div class="tab-pane fade" style="border: 0.5px solid #ddd" id="tab' + tabID + '"> <td valign="top" width="50%"> <div id="gridContainer">  <div id="myGrid' + tabID + '" style="width: 100%;' +
        ' overflow:inherit; height: 300px;" class="my-grid"></div> </div> </td> </div>'));


    jQuery.getJSON(baseurl + renderurl ,  dataString,  function (data1) {

        // grid.setData(data);
        // grid.render();
        // attachAutoResizeDataGrid(grid, "myGrid" + tabID, "gridContainer");
        //
        var tabNum = data1[0].TAG_TAB
         grid = CreateSlick(data1, columns, options, tabNum);
        //CreateGrid("myGrid" + tabNum, data1, columns, options, tabNum );
        if(itab < AmendTabCount)  {
            createGridTab(AmendTestCaseId, getPath, testcasename, getShwlink, itab + 1, defaultenteredurl, AmendTabCount );
        }
        // grid.render();
        // attachAutoResizeDataGrid(grid, "myGrid" + tabID, "gridContainer");
    });
}


