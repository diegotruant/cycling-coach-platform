
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

async function backup() {
    console.log("📦 Starting Full Software Backup...");

    const projectRoot = process.cwd();

    // 1. Define Destinations
    // User specified path: G:\Il mio Drive\00Software
    const drivePath = "G:\\Il mio Drive\\00Software";
    const localBackupDir = path.join(projectRoot, 'backups');

    let targetDir = "";

    // Check if Drive path exists
    if (fs.existsSync(drivePath)) {
        console.log(`✅ Google Drive path detected: ${drivePath}`);
        targetDir = drivePath;
    } else {
        console.log(`⚠️  Google Drive path not found (${drivePath})`);
        console.log(`ℹ️  Falling back to local 'backups' directory.`);
        if (!fs.existsSync(localBackupDir)) {
            fs.mkdirSync(localBackupDir);
        }
        targetDir = localBackupDir;
    }

    // 2. Prepare Zip Name
    const date = new Date();
    const timestamp = date.toISOString().replace(/[:.]/g, '-');
    const zipName = `DDTraining_Full_Backup_${timestamp}.zip`;
    const outputPath = path.join(targetDir, zipName);

    // 3. Create Zip (Source Code Only - No node_modules/.next)
    try {
        console.log("🗜️  Compressing software files...");
        const zip = new AdmZip();

        // Add Directories
        console.log("   - Adding src/");
        zip.addLocalFolder(path.join(projectRoot, 'src'), 'src');

        console.log("   - Adding public/");
        zip.addLocalFolder(path.join(projectRoot, 'public'), 'public');

        console.log("   - Adding data/");
        if (fs.existsSync(path.join(projectRoot, 'data'))) {
            zip.addLocalFolder(path.join(projectRoot, 'data'), 'data');
        }

        // Add Root Files (Configs, Env, Readme)
        const rootFiles = [
            'package.json',
            'package-lock.json',
            'tsconfig.json',
            'next.config.ts',
            'tailwind.config.ts',
            'postcss.config.mjs',
            'eslint.config.mjs',
            '.env',
            '.gitignore',
            'README.md',
            'components.json'
        ];

        console.log("   - Adding configuration files...");
        for (const file of rootFiles) {
            const filePath = path.join(projectRoot, file);
            if (fs.existsSync(filePath)) {
                zip.addLocalFile(filePath);
            }
        }

        // 4. Write Zip
        console.log(`💾 Saving backup to: ${outputPath}...`);
        zip.writeZip(outputPath);
        console.log(`✅ Backup Completed Successfully!`);
        console.log(`   Location: ${outputPath}`);

    } catch (err) {
        console.error("❌ Backup Failed:", err);
        process.exit(1);
    }
}

backup().catch(console.error);
