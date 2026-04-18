const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

function wrapText(ctx, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

module.exports = {
    config: {
        name: "certificate",
        version: "2.1",
        author: "Itachi Soma",
        countDown: 10,
        role: 0,
        category: "image"
    },

    onStart: async function ({ api, event, args, message }) {
        const { threadID, senderID, mentions, type, messageReply } = event;
        let id, reason;

        if (type == "message_reply") {
            id = messageReply.senderID;
            reason = args.join(" ");
        } else if (Object.keys(mentions).length > 0) {
            id = Object.keys(mentions)[0];
            reason = args.join(" ").replace(/@\[.*?\d+\]/g, "").trim();
        } else if (args[0] && (args[0].includes("facebook.com") || !isNaN(args[0]))) {
            const input = args[0];
            if (!isNaN(input)) { id = input; } 
            else {
                try { id = await api.getUID(input); } catch { id = null; }
            }
            reason = args.slice(1).join(" ");
        } else {
            id = senderID;
            reason = args.join(" ");
        }

        if (!id || !reason) return message.reply("⚠️ Usage: !certificate @tag [motif]");

        try {
            const info = await api.getUserInfo(id);
            const name = info[id] ? info[id].name : "Utilisateur";
            const pfpUrl = `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

            const canvas = createCanvas(1000, 700);
            const ctx = canvas.getContext("2d");

            const bgGradient = ctx.createRadialGradient(500, 350, 100, 500, 350, 600);
            bgGradient.addColorStop(0, "#fffdf5");
            bgGradient.addColorStop(1, "#f2e9d0");
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.globalAlpha = 0.05;
            for (let i = 0; i < 1000; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? "#000" : "#fff";
                ctx.fillRect(Math.random() * 1000, Math.random() * 700, 1, 1);
            }
            ctx.globalAlpha = 1.0;

            ctx.strokeStyle = "#C5A059";
            ctx.lineWidth = 15;
            ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
            ctx.lineWidth = 3;
            ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);

            const pfpRes = await axios.get(pfpUrl, { responseType: 'arraybuffer' });
            const pfpImg = await loadImage(Buffer.from(pfpRes.data, 'utf-8'));
            
            ctx.save();
            ctx.shadowColor = "rgba(0,0,0,0.4)";
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(150, 150, 65, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(pfpImg, 85, 85, 130, 130);
            ctx.restore();
            
            ctx.strokeStyle = "#8e6d13";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(150, 150, 65, 0, Math.PI * 2);
            ctx.stroke();

            ctx.textAlign = "center";
            ctx.fillStyle = "#2c3e50";
            ctx.font = "italic 30px serif";
            ctx.fillText("Certificat d'Excellence", canvas.width / 2, 120);

            ctx.font = "bold 90px serif";
            ctx.fillStyle = "#8e6d13";
            ctx.fillText("DIPLÔME", canvas.width / 2, 220);

            ctx.font = "30px serif";
            ctx.fillStyle = "#555";
            ctx.fillText("Décerné solennellement à", canvas.width / 2, 300);

            ctx.font = "bold 60px Arial";
            ctx.fillStyle = "#000";
            ctx.fillText(name, canvas.width / 2, 380);

            ctx.font = "italic 35px serif";
            ctx.fillStyle = "#2c3e50";
            const lines = wrapText(ctx, `« ${reason} »`, 800);
            lines.forEach((line, index) => {
                ctx.fillText(line, canvas.width / 2, 480 + (index * 45));
            });

            ctx.textAlign = "left";
            ctx.font = "20px Arial";
            ctx.fillStyle = "#555";
            ctx.fillText("Fait le " + new Date().toLocaleDateString('fr-FR'), 100, 630);

            ctx.textAlign = "right";
            ctx.font = "italic 35px serif";
            ctx.fillStyle = "#1a2a6c";
            ctx.fillText("Signature de l'autorité", 900, 630);
            ctx.font = "12px Arial";
            ctx.fillText("Itachi Soma", 900, 650);

            const sealX = 850, sealY = 540, radius = 55;
            ctx.save();
            ctx.fillStyle = "#B22222";
            ctx.translate(sealX, sealY);
            ctx.beginPath();
            for (let i = 0; i < 40; i++) {
                let r = (i % 2 === 0) ? radius : radius + 15;
                let angle = (i * Math.PI * 2) / 40;
                ctx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            ctx.beginPath();
            ctx.arc(sealX, sealY, radius, 0, Math.PI * 2);
            ctx.fillStyle = "#ED1C24";
            ctx.fill();
            ctx.strokeStyle = "#C5A059";
            ctx.lineWidth = 3;
            ctx.stroke();
            
            ctx.fillStyle = "#fff";
            ctx.font = "bold 25px Arial";
            ctx.textAlign = "center";
            ctx.fillText("★", sealX, sealY + 10);

            const cacheDir = path.join(__dirname, "cache");
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
            const imgPath = path.join(cacheDir, `cert_${id}_${Date.now()}.png`);
            
            fs.writeFileSync(imgPath, canvas.toBuffer());

            return message.reply({
                body: `🏅 Félicitations ${name} !`,
                attachment: fs.createReadStream(imgPath)
            }, () => { 
                setTimeout(() => { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); }, 5000);
            });

        } catch (error) {
            return message.reply("❌ Erreur de génération.");
        }
    }
};