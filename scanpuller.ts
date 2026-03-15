import { sleep } from "bun"

export { }

const HOST = Bun.env.PULLER_HOST
const WATCH_PATH = Bun.env.PULLER_WATCH_PATH
const DOWNLOAD_FOLDER = Bun.env.PULLER_DOWNLOAD_FOLDER || "/download/"

const SLEEP_BETWEEN_PINGS = Bun.env.PULLER_SLEEP_BETWEEN_PINGS || 60_000
const SLEEP_BETWEEN_SCANS = Bun.env.PULLER_SLEEP_BETWEEN_SCANS || 5_000

type FileEntry = {fileName:string, fileSize: number}

async function getFiles() : Promise<FileEntry[]> {
    console.log("Trying to get files...")
    const file_response = await fetch(HOST + WATCH_PATH, {
        method: "GET"
    });
    console.log("Got response: ")

    // console.log("Received: ", file_response)
    const body = await file_response.text();

    console.log("Parsing response...")
    // Extract table rows using a simple HTML parser
    const rows: FileEntry[] = [];
    // Skip all body content before the first row and
    // the first row itself, containing the link to the parent folder
    const tableRows = body.split("<tr>").slice(2);

    for (const row of tableRows) {
        const cells = row.split("</td>").filter(cell => cell.trim().startsWith("<td"));
        const fileNameCell = cells[0];
        const fileSizeCell = cells[1];

        const fileNameMatch = fileNameCell.match(/<a[^>]*>([^<]*)<\/a>/);
        const fileName = fileNameMatch ? fileNameMatch[1].trim() : "N/A";

        const fileSizeMatch = fileSizeCell.match(/<td[^>]*>([^<]*)/);
        const fileSize = fileSizeMatch ? parseInt(fileSizeMatch[1].trim()) : -1;

        rows.push({ fileName, fileSize });
    }

    return rows
}

async function processFile(file: FileEntry) {
    // Download file
    const response = await fetch(HOST + WATCH_PATH + file.fileName)
    console.log("Parsing response...")
    const file_content = await response.blob();
    // Write file
    Bun.write(DOWNLOAD_FOLDER + file.fileName, file_content)
    // Delete file from server
    const delete_respone = await fetch(HOST + "/delete" + WATCH_PATH + file.fileName, { method: "POST" })
    console.log("Processed file: ", file.fileName)
}

var err = false;

if (HOST === undefined){
    console.error("Missing env variable: 'PULLER_HOST' needs to be defined (e.g. PULLER_HOST=192.168.1.100)");
    err = true;
}
if (WATCH_PATH === undefined){
    console.error("Missing env variable: 'PULLER_WATCH_PATH' needs to be defined (e.g. PULLER_WATCH_PATH=/files/scanresults)");
    err = true;
}

console.log("Reading from server " + HOST + " at path '" + WATCH_PATH + "'.");
console.log("Files will be placed in '" + DOWNLOAD_FOLDER + "'");
console.log("Wait time between pings is " + SLEEP_BETWEEN_PINGS)
console.log("Wait time between scans is " + SLEEP_BETWEEN_SCANS)

while (true) {

    if (err) {
        console.log("Exiting due to errors...");
        break;
    }
    try {
        const files = await getFiles();
        for (const file of files) {
            if (file.fileSize == 0){
                continue
            }
            processFile(file)
        }
        await sleep(SLEEP_BETWEEN_SCANS)
    } catch (error) {
        await sleep(SLEEP_BETWEEN_PINGS)
    }
}
