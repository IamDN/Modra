var cuttingPlanHandler = {
    PT_TO_MM: 0.3527777778,

    download: function(cuttingPlan) {
        console.log("Creating PDF for cutting plan")
        this.createDocument(cuttingPlan)
    },

    createDocument: function(cuttingPlan) {
        // Create pdf with jsPDF library
        const doc = new jsPDF({
            format: 'a4',
            orientation: 'l',
        });

        // Scaling coefficient
        const coef = 1 / 10;
        // Set initial font size
        doc.setFontSize(12);

        // Delete the first (default) page
        doc.deletePage(1);

        // Add a new page
        let pageSize = this.getPageSize(cuttingPlan, coef);
        doc.addPage([pageSize.x, pageSize.y]);

        // Draw boards
        let codeList = [];
        let csv = [];
        let csv2 = [];
        let boardPos = { x: 10, y: 50 };
        console.log(cuttingPlan.boards)
        for (let i = 0; i < cuttingPlan.boards.length; i++)
        {
            let board = cuttingPlan.boards[i];
            let boardSize = board.size;

            // Scale whole board
            boardSize.x *= coef;
            boardSize.y *= coef;

            this.drawBoard(doc, board, boardPos, i, coef, codeList, csv, csv2);

            // Move to next board
            boardPos.y += boardSize.y + 10;
        }
       
        this.drawSummary(doc, cuttingPlan.summary, codeList);

        // Export PDF
        doc.save(cuttingPlan.name + '.pdf');
        this.createcsv(csv,"cuttingPlan");
        this.createcsv(csv2,"drillingPlan");

        this.sendEmail();

    },

    sendEmail: async function() {
 
        const templateParams = {
            to_email: "iam@davidneudecker.com",
            subject: "test",
            message: "HI",
            // attachments: [
            //     {
            //         filename: file.name,
            //         content: base64File,
            //         type: file.type,
            //     }
            // ]
        };

        // Send email with attachment
        try {
            await emailjs.send("service_jitjt2l", "template_doyiuen", templateParams);
            alert("Email sent successfully!");
        } catch (error) {
            console.error("Failed to send email:", error);
            alert("Failed to send email.");
        }
    
        
    },

    createcsv: function (rows,name) {

        let csvContent = "data:text/csv;charset=utf-8,"
            + rows.map(e => e.join(";")).join("\n");
        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", name + ".csv");
        document.body.appendChild(link); // Required for FF

        link.click();
    },

    drawSummary: function(doc, summary, codeList) {
        doc.setFontSize(12);

        doc.setTextColor(255, 20, 20);
        doc.text(10, 10, summary.heading);

        // Draw bin summary
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(200, 10, "Element summary:", null, 0);

        this.wrapText(
            doc, summary.content,
            200, 15,
            9, 5,
            75, 35
        );

        // Draw bin codelist
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(70, 10, "Element codelist:", null, 0);

        let codeListText = "";
        for (let i = 0; i < codeList.length; i++) {
            let item = codeList[i];
            codeListText += `[${item.code}] ${item.bin.name}\n`;
        }

        this.wrapText(
            doc, codeListText,
            70, 15,
            9, 5,
            125, 35
        );
    },

    drawBoard: function(doc, board, pos, index, coef, codeList, csv, csv2) {
        // Draw heading
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(
            pos.x, pos.y - 1,
            `${parseInt(board.size.x*10)}x${parseInt(board.size.y*10)}x${board.thickness} mm`
        );

        let size = board.size;

        // Get bounds corners
        let p0 = { x: pos.x,          y: pos.y };
        let p1 = { x: pos.x + size.x, y: pos.y };
        let p2 = { x: pos.x,          y: pos.y + size.y };
        let p3 = { x: pos.x + size.x, y: pos.y + size.y };
        // Draw bounds
        doc.setDrawColor(0, 0, 0);
        doc.line(p0.x, p0.y, p1.x, p1.y);
        doc.line(p1.x, p1.y, p3.x, p3.y);
        doc.line(p3.x, p3.y, p2.x, p2.y);
        doc.line(p2.x, p2.y, p0.x, p0.y);

        // Draw all bins inside board
        for (let i = 0; i < board.bins.length; i++) {
            let bin = board.bins[i];

            let codeIdx = codeList.length;
            let code = 'E' + `${codeIdx}`.padStart(2, '0');

            codeList.push({
                code: code,
                bin: bin
            });

            this.drawBin(doc, bin, coef, pos, code, i,size, csv, csv2);
        }
    },


    drawBin: function(doc, bin, coef, pos, code,idx,size, csv,csv2) {

        
        // Draw border
        for (let i = 0; i < bin.border.length; i++) {
            let border = bin.border[i];
            let rot = bin. rotation==="Rotated";
            let p = [];
            let p2 = [];
            for (let j = 0; j < border.length; j += 2) {
                p[j / 2] = {
                    x: border[j    ] * coef + pos.x,
                    y: border[j + 1] * coef + pos.y,
                };
                p2[j / 2] = {
                    x: border[j],
                    y: border[j + 1] ,
                };;
            }
            
            for (let j = 0; j < border.length; j += 2) {
                p2[j / 2] = {
                    x: border[j    ] ,
                    y: border[j + 1] ,
                };;
            }

            let binWidth  = p[1].x - p[0].x;
            let binHeight = p[2].y - p[0].y;
            
            let binWidth2  = p2[1].x - p2[0].x;
            let binHeight2 = p2[2].y - p2[0].y;

            let textX = p[2].x;
            let textY = p[2].y;

            csv.push(["365936", code, p2[1].x - p2[0].x, p2[2].y - p2[0].y, "1"])
            csv2.push(["365936", code, p2[1].x - p2[0].x, p2[2].y - p2[0].y, "1", "ano",bin.banding[0] == 0,bin.banding[1] == 0,bin.banding[2] == 0,bin.banding[3] == 0,"no","note"])
            // check for existing same line in csv
            if (csv.length > 0) {
                
            }
            //testing code for drilling
            for(let j = 0; j < bin.drilling.length; j++){

                let drill = bin.drilling[j];
        
                // check if any value is NaN
                if (isNaN(drill[0]) || isNaN(drill[1]) || isNaN(drill[2]) || isNaN(drill[3]) || isNaN(drill[4]) || isNaN(drill[5])) continue;
                csv2.push( [,,,,,,,,,,,,drill[0], Math.round( drill[1]),Math.round(drill[2]), drill[3],drill[4],drill[5]]);

                if (drill[0] <=1 )
                 this.drawSurfaceDrill(doc, drill[1]* coef + p[0].x, drill[2]* coef + p[0].y, drill[4]* coef);
                else if (drill[0] ===3 || drill[0] ===4)
                 this.drawEdgeDrill(doc,drill ,p ,coef, rot);
                else
                 this.drawChannel(doc,drill ,p ,coef, rot);
            } 

            doc.setFontSize(10);
            doc.text(p[2].x, p[0].y +3, code , null, 0);
             if( (binWidth2+ 1)< size.x*10)
                doc.text(p[2].x + binWidth / 2 - 5,  p[2].y , binWidth2 + " mm" , null, 0);
            if((binHeight2 + 1)< size.y*10)
                doc.text(p[3].x-5,  p[3].y -binHeight/2, binHeight2 + " mm" , null, 0);
     
            this.drawLine(doc,p[0].x, p[0].y, p[1].x, p[1].y, bin.banding[0] == 0 )
            this.drawLine(doc,p[1].x, p[1].y, p[3].x, p[3].y, bin.banding[1] == 0)
            this.drawLine(doc,p[3].x, p[3].y, p[2].x, p[2].y, bin.banding[2] == 0)
            this.drawLine(doc,p[2].x, p[2].y, p[0].x, p[0].y, bin.banding[3] == 0)
        }
        // Draw grid
        for (let i = 0; i < bin.grid.length; i++) {
            let grid = bin.grid[i];
            let p = [];

            for (let j = 0; j < grid.length; j += 2) {
                p[j / 2] = {
                    x: grid[j    ] * coef + pos.x,
                    y: grid[j + 1] * coef + pos.y,
                };
            }
            let banding = bin.banding[i] == 0;
            for (let j = 1; j < p.length; j++) {
                this.drawLine(doc, p[j - 1].x, p[j - 1].y, p[j].x, p[j].y, banding )
            }
        }
    },
    drawChannel: function(doc, drill, points, coef, rotation) {
        let [t,x,y,h,w,l] = drill;
        var s = points[0];
        doc.setDrawColor(255, 0, 0);
        if ((t == 5 && !rotation) || (t == 6 && rotation) )
        {
            doc.line(s.x + x * coef, s.y + y* coef + w / 2  * coef, s.x + x  * coef+ l * coef, s.y + y * coef + w / 2  * coef);
            doc.line(s.x + x * coef, s.y + y* coef - w / 2  * coef, s.x + x  * coef+ l * coef, s.y + y * coef - w / 2  * coef);
        }
        else
        {
            doc.line(s.x + x * coef + w / 2 * coef, s.y + y * coef, s.x + x * coef , s.y + y * coef + l * coef);
            doc.line(s.x + x * coef - w / 2 * coef, s.y + y * coef, s.x + x * coef, s.y + y * coef + l * coef);
        }
    },
    drawLine: function (doc,x1,y1,x2,y2,banding) {

        if (banding) doc.setDrawColor(255, 0, 0); else doc.setDrawColor(0, 0, 255);
        doc.line(x1, y1, x2, y2);
    },
    drawSurfaceDrill: function(doc, x, y, r) {
        doc.setDrawColor(255, 0, 0);
    
        //draw cross at center and circle
        doc.line(x - r, y, x + r, y);
        doc.line(x, y - r, x, y + r);
        //TODO draw circle
        doc.circle(x, y, r/2,'S');
    },
    drawEdgeDrill: function(doc, drills, points, coef, rot) {

        var edgeType = drills[5]; // bottom = 0, right = 1, top = 2, left = 3
        var start = points[0];
        var end = points[3];
        var radius = drills[4]/2 * coef;
        var x =drills[1]* coef;
        var y =drills[2]* coef;
        var z =drills[3]* coef;
        
        //draw cross at center and circle
        doc.setDrawColor(255, 0, 0);
switch (true) {
    case (edgeType === 0 && !rot):
        doc.line(start.x + x - radius, end.y, start.x + x - radius, end.y - z);
        doc.line(start.x + x + radius, end.y, start.x + x + radius, end.y - z);
        doc.line(start.x + x, end.y, start.x + x, end.y - z);
        doc.line(start.x + x - radius, end.y - z, start.x + x + radius, end.y - z);
        break;
    case (edgeType === 1 && !rot):
        doc.line(end.x, end.y - x - radius, end.x - z, end.y - x - radius);
        doc.line(end.x, end.y - x + radius, end.x - z, end.y - x + radius);
        doc.line(end.x, end.y - x, end.x - z, end.y - x);
        doc.line(end.x - z, end.y - x - radius, end.x - z, end.y - x + radius);
        break;
    case (edgeType === 2 && !rot):
        doc.line(end.x - x - radius, start.y, end.x - x - radius, start.y + z);
        doc.line(end.x - x + radius, start.y, end.x - x + radius, start.y + z);
        doc.line(end.x - x, start.y, end.x - x, start.y + z);
        doc.line(end.x - x - radius, start.y + z, end.x - x + radius, start.y + z);
        break;
    case (edgeType === 3 && !rot):
        doc.line(start.x, start.y + x - radius, start.x + z, start.y + x - radius);
        doc.line(start.x, start.y + x + radius, start.x + z, start.y + x + radius);
        doc.line(start.x, start.y + x, start.x + z, start.y + x);
        doc.line(start.x + z, start.y + x - radius, start.x + z, start.y + x + radius);
        break;
    case (edgeType === 0 && rot):
        doc.line(start.x, start.y + x - radius, start.x + z, start.y + x - radius);
        doc.line(start.x, start.y + x + radius, start.x + z, start.y + x + radius);
        doc.line(start.x, start.y + x, start.x + z, start.y + x);
        doc.line(start.x + z, start.y + x - radius, start.x + z, start.y + x + radius);
        break;
    case (edgeType === 1 && rot):
        doc.line(start.x + x - radius, end.y, start.x + x - radius, end.y - z);
        doc.line(start.x + x + radius, end.y, start.x + x + radius, end.y - z);
        doc.line(start.x + x, end.y, start.x + x, end.y - z);
        doc.line(start.x + x - radius, end.y - z, start.x + x + radius, end.y - z);
        break;
    case (edgeType === 2 && rot):
        doc.line(end.x,      end.y - x - radius,  end.x - z, end.y - x - radius);
        doc.line(end.x,      end.y - x + radius, end.x - z, end.y - x + radius);
        doc.line(end.x,      end.y - x,               end.x - z, end.y - x);
        doc.line(end.x - z, end.y - x - radius,  end.x - z, end.y - x + radius);
        break;
    case (edgeType === 3 && rot):
        doc.line(end.x - x - radius, start.y, end.x - x - radius, start.y + z);
        doc.line(end.x - x + radius, start.y, end.x - x + radius, start.y + z);
        doc.line(end.x - x, start.y, end.x - x, start.y + z);
        doc.line(end.x - x - radius, start.y + z, end.x - x + radius, start.y + z);
        break;
}
 
    },
    getPageSize: function(cuttingPlan, coef) {
        // Default to A4
        let pageWidth = 0;
        let pageHeight = 0;

        for (let i = 0; i < cuttingPlan.boards.length; i++)
        {
            let board = cuttingPlan.boards[i];
            let boardSize = board.size;

            if (boardSize.x > pageWidth)
                pageWidth = boardSize.x * coef;

            pageHeight += boardSize.y * coef + 10;
        }

        pageWidth += 20;
        pageHeight += 50;

        // Default to A4 size
        pageWidth = Math.max(pageWidth, 297);
        pageHeight = Math.max(pageHeight, 297);

        return {
            x: pageWidth / this.PT_TO_MM,
            y: pageHeight / this.PT_TO_MM
        };
    },

    wrapText: function(
        doc, text,
        x, y,
        startFontSize, minFontSize,
        width, height,
    ) {
        doc.setFontSize(startFontSize)

        let startX = x;
        let startY = y;

        let lines = text.split(/\r\n|\r|\n/);

        let lineWidth = 0;
        let lineHeight = doc.getLineHeight() * this.PT_TO_MM;

        for (let i = 0; i < lines.length; i++) {
            let lw = doc.getTextWidth(lines[i]);
            if (lw > lineWidth) lineWidth = lw;
        }

        // Padding between columns
        lineWidth += lineHeight * 0.25;

        let canFitLines = height / lineHeight;
        let columnCount = Math.ceil(lines.length / canFitLines);

        while (columnCount * lineWidth > width || canFitLines < 1)
        {
            // Lower font size (break if too small)
            let fontSize = doc.getFontSize() - 1;
            if (fontSize < minFontSize) break;

            // Set desired font size
            doc.setFontSize(fontSize);

            // Update old values
            lineWidth = 0;
            lineHeight = doc.getLineHeight() * this.PT_TO_MM;
            canFitLines = height / lineHeight;
            columnCount = Math.ceil(lines.length / canFitLines);

            for (let i = 0; i < lines.length; i++) {
                let lw = doc.getTextWidth(lines[i]);
                if (lw > lineWidth) lineWidth = lw;
            }

            // Padding between columns
            lineWidth += lineHeight * 0.25;
        }

        if (lines.length * lineHeight > height) {
            while (lines.length > 0) {
                let column = lines.splice(0, canFitLines);

                for (let i = 0; i < column.length; i++) {
                    doc.text(x, y, column[i], null, 0);
                    y += lineHeight;
                }

                y = startY;
                x += lineWidth;
            }
        } else {
            doc.text(x, y, text, null, 0);
        }
    }
}

var layoutHandler = {
    lineStyles:
    {
        1: {
            dash: null,
            width: 0.1
        },

        2: {
            dash: [1, 1],
            width: 0.1
        },

        3: {
            dash: null,
            width: 0.3
        },
    },

    // Temp For debug
    // npx eslint Work/GitHub/Modra3D/Build/testWebGL/TemplateData/pdfHandler.js
    download: function(layout) {
        console.log('Creating PDF for layout index' + layout.style)
        this.createDocument(layout);
    },

    createDocument: function(layout) {
        // Create pdf with jsPDF library
        const doc = new jsPDF({
            format: 'a4',
            orientation: 'l',
        });

        // Set initial font size
        doc.setFontSize(12);
        doc.text(100, 10, layout.materialLabel)

        // Draw images
        for (let i = 0; i < layout.images.length; i++) {
            let image = layout.images[i];
            this.drawImage(doc, image);
        }

        // Draw views
        for (let i = 0; i < layout.views.length; i++) {
            let view = layout.views[i];
            this.drawView(doc, view);
        }

        // Draw summary
        this.drawSummary(doc, layout.summary);

        // Export PDF
        doc.save(layout.name + '.pdf');
    },

    drawView: function(doc, view) {
        // Define view extend values
        const extend = this.getViewExtend(view);
        const centerX = (extend.min.x + extend.max.x) / 2;
        const centerY = (extend.min.y + extend.max.y) / 2;
        const coef = Math.max(
            view.rect.sizeX / extend.max.x,
            view.rect.sizeY / extend.max.y
        );

        //TODO move false values check to Unity build
        if (isNaN(extend.min.x) || isNaN(extend.max.x) || isNaN(extend.min.y) || isNaN(extend.max.y))
            return;

        // Draw Lines
        this.drawLines(doc, view, extend.max.y, coef);
        let dimY = this.drawDims(doc, view, extend.max.y, centerX, centerY, coef);

        // View type description
        doc.setTextColor(0, 0, 0);
        doc.text(view.rect.posX, view.rect.posY -dimY- 10, view.type + " M 1:" + view.scale);
    },

    drawLines: function(doc, view, maxY, coef) {
        doc.setDrawColor(0, 0, 0);
        const ctx = doc.context2d;

        // Loop through each edge
        for (var ei = 0; ei < view.edges.length; ei++) {
            let edge = view.edges[ei];

            let lines = edge.lines;
            let arcs = edge.arcs;

            // Set line dash based on line style
            // and skip edges without any style

            let style = this.lineStyles[edge.style];
            if (style === undefined) continue;

            doc.setLineDash(style.dash);
            doc.setLineWidth(style.width);

            ctx.beginPath();

            // Draw lines
            if (lines.length > 0)
            {
                // Set offset for first line to origin
                let oX = lines[0] * coef + view.rect.posX;
                let oY = (maxY - lines[1]) * coef + view.rect.posY;

                ctx.moveTo(oX, oY);

                // Store each point as an offset from last point
                for (var vi = 0; vi < lines.length; vi += 2) {
                    var pX = lines[vi] * coef + view.rect.posX
                    var pY = (maxY - lines[vi + 1]) * coef + view.rect.posY

                    ctx.lineTo(pX, pY);
                }
            }

            ctx.stroke();

            // +
            // Draw arcs
            /*
            for (var i = 0; i < arcs.length; i++) {
                let arc = arcs[i];

                ctx.beginPath();

                let r = arc.radius * coef;
                let cX = arc.center.x * coef + view.rect.posX;
                let cY = arc.center.y * coef + view.rect.posY;

                ctx.arc(cX, cY, r, arc.startAngle, arc.endAngle, arc.clockwise);
                ctx.stroke();
            }
            */
        }
    },

    drawDims: function(doc, view, maxY, centerX, centerY, coef) {
        doc.setDrawColor(100, 100, 100);

        const dimSize = 5;
        const dimExt = 1.2;

        let overlaps = {};
        let minY = view.rect.posY;

        // Dims are never dashed
        doc.setLineDash(null);

        // Loop through each edge
        for (var ei = 0; ei < view.edges.length; ei++) {
            let edge = view.edges[ei];
            let dims = edge.dims;

            let length = dims.length / 4;

            // Loop through each dimension
            for (var di = 0; di < length; di++) {
                var ai = di * 4;
                var bi = di * 4 + 2;

                let a = { x: dims[ai], y: (maxY - dims[ai + 1]) };
                let b = { x: dims[bi], y: (maxY - dims[bi + 1]) };
                let m = { x: centerX, y: maxY - centerY };
                let c = { x: (a.x + b.x) * 0.5, y: (a.y + b.y) * 0.5 };

                // TODO: Move false values check to Unity build
                if (a.x == b.x && a.y == b.y)
                    continue;
                if ((a.x + b.x) - (a.y + b.y) === 0)
                    continue;

                let dir = this.normalize({
                    x: b.x - a.x,
                    y: b.y - a.y
                });

                let line = { a, b };
                let dimOffset = 0;

                if (overlaps[dir] == undefined)
                    overlaps[dir] = [];

                // Handle overlaps and move dimOffset of there is a match
                for (let oi = 0; oi < overlaps[dir].length; oi++) {
                    let o = overlaps[dir][oi];

                    // If line and o.line are not both horisontal or vertical the continue
                    if (this.lineEquals(line, o.line)) continue;
                    if ((line.a.x == line.b.x) != (o.line.a.x == o.line.b.x)) continue;

                    if (this.checkLineOverlap(line, o.line))
                        dimOffset = Math.max(dimOffset, o.offset + 5);
                }

                var isHor = a.y == b.y;
                var value = isHor ? b.x - a.x : b.y - a.y;
                var absValue = parseInt(Math.abs(value));

                if (a.y <= minY && isHor)
                    minY = a.y - dimSize * dimExt;

                this.drawDim(doc, view, a, b, c, m, dimSize + dimOffset, dimExt, isHor, absValue, coef);
                overlaps[dir].push({ line: line, offset: dimOffset });
            }
        }

        return minY;
    },

    drawDim: function(doc, view, a, b, c, m, siz, ext, isHor, value, coef) {
        // Scale and offset all lines and vertices
        let rectPos = { x: view.rect.posX, y: view.rect.posY };
        a = this.vecAdd(this.vecScale(a, coef), rectPos);
        b = this.vecAdd(this.vecScale(b, coef), rectPos);
        c = this.vecAdd(this.vecScale(c, coef), rectPos);
        m = this.vecAdd(this.vecScale(m, coef), rectPos);

        // Draw dimension lines
        var off = { x: siz, y: siz };
        off.x *= a.x == b.x ? (a.x > m.x ? 1 : -1) : 0;  // x setup
        off.y *= a.y == b.y ? (a.y > m.y ? 1 : -1) : 0;  // y setup

        doc.line(a.x + off.x, a.y + off.y, b.x + off.x, b.y + off.y);
        doc.line(a.x, a.y, a.x + off.x * ext, a.y + off.y * ext)
        doc.line(b.x, b.y, b.x + off.x * ext, b.y + off.y * ext)

        if (isNaN(a.x) || isNaN(a.y) || isNaN(b.x) || isNaN(b.y))
            return

        // Draw Arrows Setup
        var arr = {
            x: (siz * (ext - 1)),
            y: (siz * (ext - 1))
        };
        var dir = []
        var labelPos = {}
        if (isHor) {  // Dimension is horisontal
            arr.x *= a.x < b.x ? 1 : -1;
            dir = [{ x: 1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: -1 }, { x: -1, y: 1 }]
            labelPos = { x: c.x, y: a.y + off.y }
        } else { // Dimension is vertical
            arr.y *= a.y < b.y ? 1 : -1;
            dir = [{ x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }]
            labelPos = { x: a.x + off.x, y: c.y }
        }

        // Draw Arrows
        doc.line(a.x + off.x, a.y + off.y, a.x + off.x + arr.x * dir[0].x, a.y + off.y + arr.y * dir[0].y);
        doc.line(a.x + off.x, a.y + off.y, a.x + off.x + arr.x * dir[1].x, a.y + off.y + arr.y * dir[1].y);
        doc.line(b.x + off.x, b.y + off.y, b.x + off.x + arr.x * dir[2].x, b.y + off.y + arr.y * dir[2].y);
        doc.line(b.x + off.x, b.y + off.y, b.x + off.x + arr.x * dir[3].x, b.y + off.y + arr.y * dir[3].y);

        //Draw label
        doc.setFontSize(150 / view.scale);
        doc.setTextColor(100, 100, 100);
        doc.text(value.toString(), labelPos.x, labelPos.y)
    },

    getViewExtend: function(view) {
        let edges = view.edges;
        let min = { x: Number.MAX_VALUE, y: Number.MAX_VALUE };
        let max = { x: Number.MIN_VALUE, y: Number.MIN_VALUE };

        for (let ei = 0; ei < edges.length; ei++) {
            let edge = edges[ei];
            let lines = edge.lines;
            let length = lines.length / 2;

            for (let vi = 0; vi < length; vi++) {
                min.x = Math.min(min.x, lines[vi * 2])
                min.y = Math.min(min.y, lines[vi * 2 + 1])
                max.x = Math.max(max.x, lines[vi * 2])
                max.y = Math.max(max.y, lines[vi * 2 + 1])
            }
        }

        return { min: min, max: max }
    },

    drawImage: function(doc, image) {
        // Get dimensions
        const width = image.width;
        const height = image.height;

        // Create canvas
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        // Create context from pixel array
        const data = new ImageData(image.data, width, height)
        const context = canvas.getContext('2d')

        // Put image onto canvas
        context.putImageData(data, 0, 0)

        // Fill non-transparent image with white background
        if (image.format !== 'PNG') {
            context.globalCompositeOperation = "destination-over";
            context.fillStyle = 'rgba(255, 255, 255, 1.0)'
            context.fillRect(0, 0, width, height)
        }

        // Set source of the image
        const img = new Image()
        img.src = canvas.toDataURL('image/' + image.format)

        // Calculate image size and add to the document
        const imgCoef = {
            x: width / image.rect.sizeX,
            y: height / image.rect.sizeY
        }

        const imgw = width / imgCoef.x
        const imgh = height / imgCoef.y

        // Add image canvas to document
        doc.addImage(
            img.src, image.format,
            image.rect.posX, image.rect.posY,
            imgw, imgh
        );
    },

    drawSummary: function(doc, summary) {
        doc.setDrawColor(0, 0, 0);

        // Draw heading
        doc.setTextColor(40, 67, 135);
        doc.setFontSize(13);
        doc.setFontStyle("bold");
        doc.text(summary.heading, summary.rect.posX + 2, summary.rect.posY + 5);

        // Draw description
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.setFontStyle("italic");
        doc.text(summary.description, summary.rect.posX + 2, summary.rect.posY + 9);

        // Draw content
        doc.setFontSize(8);
        doc.text(summary.content, summary.rect.posX + 2, summary.rect.posY + 14);
    },

    // Following functions were inspired
    // by the netDxf.MathHelper library

    lineEquals: function(l0, l1) {
        return this.vecEquals(l0.a, l1.a) && this.vecEquals(l0.b, l1.b);
    },

    vecScale: function(v, s) {
        return { x: v.x * s, y: v.y * s };
    },

    vecAdd: function(u, v) {
        return { x: u.x + v.x, y: u.y + v.y };
    },

    vecEquals: function(u, v) {
        return u.x == v.x && u.y == v.y;
    },

    normalize: function(v) {
        let w = v.x * v.x + v.y * v.y;
        let x = v.x / Math.sqrt(w);
        let y = v.y / Math.sqrt(w);
        return { x: x, y: y };
    },

    getLineDir: function(l) {
        let dx = l.b.x - l.a.x;
        let dy = l.b.y - l.a.y;
        return this.normalize({ x: dx, y: dy });
    },

    cross: function(u, v) {
        return u.x * v.y - u.y * v.x;
    },

    dot: function(u, v) {
        return u.x * v.x + u.y * v.y;
    },

    areParallel: function(u, v) {
        let c = this.cross(u, v);
        return c >= -Number.EPSILON && c <= Number.EPSILON;
    },

    findIntersection: function(p0, d0, p1, d1) {
        if (this.areParallel(d0, d1))
            return undefined;

        let v = { x: p1.x - p0.x, y: p1.y - p0.y };
        let c = this.cross(d0, d1);
        let s = (v.x * d1.y - v.y * d1.x) / c;
        return { x: p0.x + s * d0.x, y: p0.y + s * d0.y };
    },

    pointInSegment: function(p, start, end) {
        let dir = { x: end.x - start.x, y: end.y - start.y };
        let pPrime = { x: p.x - start.x, y: p.y - start.y };
        let t = this.dot(dir, pPrime);

        if (t < 0) return -1;
        let d = this.dot(dir, dir);
        if (t > d) return 1;

        return 0;
    },

    pointLineDistance: function(p, origin, dir) {
        let t = this.dot(dir, { x: p.x - origin.x, y: p.y - origin.y });
        let pPrime = { x: origin.x + t * dir.x, y: origin.y + t * dir.y };
        let vec = { x: p.x - pPrime.x, y: p.y - pPrime.y };
        let distSquared = this.dot(vec, vec);
        return Math.sqrt(distSquared);
    },

    checkLineOverlap: function(l0, l1, includeEndpoints = false) {
        let intersx = this.findIntersection(
            l0.a, this.getLineDir(l0),
            l1.a, this.getLineDir(l1)
        );

        if (intersx == undefined) {
            let p0 = this.pointInSegment(l0.a, l1.a, l1.b);
            let p1 = this.pointInSegment(l0.b, l1.a, l1.b);

            if (p0 + p1 != 0)
                return false;

            let d0 = this.pointLineDistance(l0.a, l1.a, this.getLineDir(l1));
            let d1 = this.pointLineDistance(l0.b, l1.a, this.getLineDir(l1));

            return Math.min(d0, d1) == 0;
        }

        if (!includeEndpoints) {
            if (this.vecEquals(l0.a, intersx) || this.vecEquals(l0.b, intersx) ||
                this.vecEquals(l1.a, intersx) || this.vecEquals(l1.b, intersx)) return false;

            let p = this.pointInSegment(intersx, l1.a, l1.b);
            if (p != 0) return false;
        }

        return true;
    },
};
