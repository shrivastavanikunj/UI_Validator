
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
                
            }

        }
    });



    /* on grid cell change function*/
    grid.onCellChange.subscribe(function (e, args) {
        // var value = data[args.row][grid.getColumns()[args.cell].field];
        if (grid.getColumns()[args.cell].name === "User Value") {
            //console.log("on cell change " + grid.getColumns()[args.cell].name);
            
        } else {
            //console.log("on cell change " + grid.getColumns()[args.cell].name);
          
        }
    });

 

function attachAutoResizeDataGrid(grid, gridId, gridContainerId) {
    var gridDomElm = jQuery('#' + gridId);
    if (!gridDomElm || typeof gridDomElm.offset() === "undefined") {
        return null;
    }
    resizeToFitBrowserWindow(grid, gridId, gridContainerId);

    jQuery(window).on("resize", function () {
        // for some yet unknown reason, calling the resize twice removes any stuttering/flickering when changing the height and makes it much smoother
        resizeToFitBrowserWindow(grid, gridId, gridContainerId);
        resizeToFitBrowserWindow(grid, gridId, gridContainerId);
    });

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


