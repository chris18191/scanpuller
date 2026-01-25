import { sleep } from "bun"

export { }

const HOST = "http://192.168.17.179"
const WATCH_PATH = "/DCIM/100HPAIO/"
const DOWNLOAD_FOLDER = "/download/"

type FileEntry = {fileName:string, fileSize: number}

async function getFiles() : Promise<FileEntry[]> {
    const file_response = await fetch(HOST + WATCH_PATH, {
        method: "GET"
    });

    // console.log("Received: ", file_response)
    const body = await file_response.text();

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
    // #### Process files
    // Download file
    const file_content = await (await fetch(HOST + WATCH_PATH + file.fileName)).blob();
    // Write file
    Bun.write(DOWNLOAD_FOLDER + file.fileName, file_content)
    // Delete file from server
    const delete_respone = await fetch(HOST + "/delete" + WATCH_PATH + file.fileName, { method: "POST" })
    console.log("Processed file: ", file.fileName)
}

while (true) {
    const files = await getFiles();
    for (const file of files) {
        if (file.fileSize == 0){
            continue
        }
        processFile(file)
    }

    await sleep(5000)
}
