fetch('data.json')
.then(response => response.json())
.then(data => {
    setup(data);
});

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

let yearId = null;
let dataYear = null;
let mode = null;

let allFrames = [];
let numberOfData = 0;
let currentFrameIndex = 0;

let quizletFrames = [];
let score = 0;

async function sendWebHook(link, name, color, title, customTextTitle, customInfo)
{
        // Génère la date actuelle au format lisible.
    const currentDate = new Date().toLocaleString();

    // Structure de l'embed pour Discord.
    const embed = {
        username: "Anatomologiste pathologique", // Nom de l'expéditeur (custom).
        avatar_url: "https://via.placeholder.com/150", // URL d'un avatar (optionnel).
        embeds: [
            {
                title: title,
                color: color, // Couleur en format décimal (ex. 0x3498db).
                fields: [
                    { name: "Prénom", value: name, inline: true },
                    { name: "Date", value: currentDate, inline: true },
                    { name: customTextTitle, value: customInfo, inline: false },
                ],
                footer: {
                    text: "Site d'entrainement anatomie pathologique", // Texte du footer.
                },
                timestamp: new Date().toISOString(), // Timestamp dans l'embed.
            },
        ],
    };

    // Envoi du webhook via fetch.
    try {
        const response = await fetch(link, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(embed),
        });

        if (response.ok) {
            console.log("Webhook envoyé avec succès !");
        } else {
            console.error("Erreur lors de l'envoi du webhook : ", response.status, response.statusText);
        }
    } catch (error) {
        console.error("Erreur lors de l'envoi du webhook : ", error);
    }
}

let userName;

function setup(data) {
    Swal.fire({
        title: "Entrainement - Anatomie pathologique",
        showConfirmButton: false,
        allowEscapeKey: false, // Désactive la touche Échap
        allowOutsideClick: false,
        html: "<strong>Bienvenue !</strong><br/>En cette période de blocus, il est difficile de s'entraîner pour ANAT Path. Ce site vous permet de vous entraîner à reconnaître des coupes histologiques. Une coupe vous sera présentée, avec un organe mentionné si nécessaire. À vous de deviner de quoi il s'agit ! Vous pourrez ensuite voir la réponse.<br/><br/><strong>Comment cela fonctionne ?</strong><br/>Une nouvelle page CYTOMINE va s'ouvrir en plein écran.<br/><strong><p style='color:red'>⚠️ ATTENTION : PARFOIS, LE NOM DE LA COUPE EST INDIQUÉ EN BAS À GAUCHE. CACHEZ-LE AVEC UN SCOTCH OU AUTRE (IMPOSSIBLE DE LE CACHER MOI-MÊME...).</p></strong><br/>Une fois votre diagnostic établi, revenez sur cette page pour voir la réponse et passer à la coupe suivante.<br/><br/>" +
        `<div class="mb-4">
        <label for="userName" class="form-label"><strong>Entrez votre prénom pour commencer :</strong> (Uniquement utilisé pour les stats)</label>
        <input type="text" class="form-control w-50 mx-auto" id="userName" placeholder="Votre prénom ici..." />
        </div>`+
        `Êtes-vous prêt ? Si oui, en quelle année êtes-vous ?<br/><div class="btn-group mt-3">`+
        `<div class="me-2"><button type="button" class="btn btn-bac3 yearSelect" id="BAC3"><i class="fas fa-graduation-cap"></i> BAC 3</button></div>`+
        `<div class=""><button type="button" class="btn btn-master1 yearSelect" id="M1"><i class="fas fa-university"></i> Master 1</button></div>`+
        `</div>`,
    })

    $(".yearSelect").click(function() {
        userName = document.getElementById('userName').value.trim();
        if (!userName)
            return;

        let id = $(this).attr('id');

        let activeColor = (id == "BAC3") ? 0xffa200 : 0xff0093;
        sendWebHook("https://discord.com/api/webhooks/1320013198191235072/gDEgriGg0K3sRyGMiiOuj7-CyOzec9oM1JidqJM8dbBXkMCboc8O4TkuhvdhHxHc-ruY", userName, activeColor, "Nouvelle partie", "Année", id); // logs sur discord de click d'année
        let dataSelected = data[id];
    
        if (dataSelected === undefined) {
            Swal.fire({
                title: "Erreur",
                icon: "error",
                text: "Les données pour cette année ne sont pas encore disponibles. Veuillez réessayer plus tard."
            });

            return;
        }

        yearId = id;
        dataYear = dataSelected;

        // Deep copy
        allFrames = JSON.parse(JSON.stringify(dataYear["frames"]));
        allFrames = allFrames.sort(() => Math.random() - 0.5);

        numberOfData = allFrames.length;
        main();
    });
}

function main() {
    // Ask the play mode (Quizlet or Random)
        Swal.fire({
            title: "Mode de jeu",
            showConfirmButton: false,
            allowEscapeKey: false, // Désactive la touche Échap
            allowOutsideClick: false,
            html: "Choisissez le mode de jeu<br/><br/>🌟Nombre de coupes : <strong>"+allFrames.length+"🌟</strong><br/><br/><strong>● Quizlet : </strong> Comme sur quizlet (J'avais pas de nom pour définir ça ...), si vous avez une coupe correcte, celle-ci sort de la liste jusqu'à ce que la liste soit vide !<br/><br/><strong>● Aléatoire : </strong> A chaque fois une coupe aléatoire est choisie, tu peux passer 2 fois sur la même<br/><br/><strong>● Aléatoire x1 : </strong>Les coupes sont aléatoires mais ne passent qu'une seule fois ! Tu peux avoir ton score à la fin<br/>" +
            `<div class="btn-group mt-3">`+
            `<div class="me-2"><button type="button" class="btn btn-success modeSelect" id="quizlet">Quizlet</button></div>`+
            `<div class="me-2"><button type="button" class="btn btn-warning modeSelect" id="random">Aléatoire</button></div>`+
            `<div class=""><button type="button" class="btn btn-danger modeSelect" id="random1">Aléatoire x1</button></div>`+
            `</div>`,
        });

        $(".modeSelect").click(function() {
            mode = $(this).attr('id');

            sendWebHook("https://discord.com/api/webhooks/1320013389422133331/arJhh_xiasGVIyTHzZ0k_e0UZlD6Jzis6OSqwBwp4P1fVaExUNTvKAm5Iw4d-bNax6rH", userName, 0x0087ff, "Mode de jeu", "Mode", mode); // logs sur discord de click de mode

            let randomIndex = Math.floor(Math.random() * allFrames.length);
            let activeFrameData = allFrames[randomIndex];

            showFrame(activeFrameData, randomIndex);
        });
}

let isOktoClose = false;
let timer = null;
let mywindow = null;

function showFrame(activeFrameData, randomIndex) {
    let link = activeFrameData["link"];
    let organ = activeFrameData["bodyPart"];
    let name = activeFrameData["name"];

    currentFrameIndex++;
    isOktoClose = false;

    if (organ == "")
        organ = "Inconnu";

    mywindow = window.open(link, "_blank", "location=no,menubar=no,scrollbars=no,status=no,titlebar=no,toolbar=no,fullscreen=yes");

    // check if is closed
    createTimer(link);

    let coupeHtml = "🌟Coupe actuelle : "+currentFrameIndex+"/"+numberOfData+"🌟<br/><br/>";

    Swal.fire({
        title: "Quelle est cette coupe ?",
        showConfirmButton: false,
        allowEscapeKey: false, // Désactive la touche Échap
        allowOutsideClick: false,
        html: `🫀 Organe : <strong>${organ}</strong><br/><br/>${(mode == "quizlet" || mode == "random1")?coupeHtml:""}
        <div class="d-flex justify-content-center">`+
        `<div class="me-2"><button type="button" class="btn btn-primary" id="showAnswer">Voir la réponse</button></div>`+
        `<div class="me-2"><button type="button" class="btn btn-warning" id="closeWindow">Fermer la fenêtre</button></div>`+
        `<div class=""><button type="button" class="btn btn-info" id="openAgain">Ré-ouvrir la coupe</button></div>`+
        `</div>`,
    });

    $("#showAnswer").click(function() {
        isOktoClose = true;
        if (mywindow) {
            mywindow.close();
        }

        Swal.fire({
            title: "Voici la réponse !",
            showConfirmButton: false,
            allowEscapeKey: false, // Désactive la touche Échap
            allowOutsideClick: false,
            html: `🔑 Réponse : <strong>${name}</strong><br/><br/>${(mode == "quizlet" || mode == "random1")?coupeHtml:""}<div class="d-flex justify-content-center">`+
            `<div class="me-2"><button type="button" class="btn btn-success giveReponse" id="1">Bonne réponse</button></div>`+
            `<div class=""><button type="button" class="btn btn-danger giveReponse" id="0">Mauvaise réponse</button></div>`+
            `</div>`,
        });

        $(".giveReponse").click(function() {
            let id = $(this).attr('id');

            if (mode == "quizlet" || mode == "random1") {
                allFrames.splice(randomIndex, 1);
            }

            if (id == "0") {
                if (mode == "quizlet") {
                    quizletFrames.push(activeFrameData);
                }
            }else
                score++;

            // Check if all frames are done
            if (allFrames.length == 0) {
                if (mode != "quizlet" || quizletFrames.length == 0) {
                    showEndGame();
                    return;
                }

                if (mode == "quizlet") {
                    allFrames = JSON.parse(JSON.stringify(quizletFrames));
                    quizletFrames = [];
                    numberOfData = allFrames.length;
                    currentFrameIndex = 0;
                }
            }

            randomIndex = Math.floor(Math.random() * allFrames.length);
            activeFrameData = allFrames[randomIndex];

            showFrame(activeFrameData,randomIndex);
        });

    });

    $("#closeWindow").click(function() {
        if (isOktoClose)
            return;

        if (!mywindow)
            return;

        isOktoClose = true;
        mywindow.close();
    });

    $("#openAgain").click(function() {
        isOktoClose = false;

        if (timer)
            clearInterval(timer);

        createTimer(link);
        mywindow = window.open(link, "_blank", "location=no,menubar=no,scrollbars=no,status=no,titlebar=no,toolbar=no,fullscreen=yes");
    });
}

function createTimer(link)
{
    timer = setInterval(function() {
        if (mywindow.closed && !isOktoClose) {
            mywindow = window.open(link, "_blank", "location=no,menubar=no,scrollbars=no,status=no,titlebar=no,toolbar=no,fullscreen=yes");
        }

        if (isOktoClose) {
            clearInterval(timer);
        }
    }, 1000);
}

function showEndGame() {
    if (mode == "random1")
        sendWebHook("https://discord.com/api/webhooks/1320013337081286696/SDtLBhmXIn2bP09KEWgoEk8WLiXv4M3TUrPGJVseATXMMybXW_9C32q76BHrGdxyqWk_", userName, 0xa6ff00, "Fin de partie", "Score", score); // logs sur discord de fin de
    else
        sendWebHook("https://discord.com/api/webhooks/1320013337081286696/SDtLBhmXIn2bP09KEWgoEk8WLiXv4M3TUrPGJVseATXMMybXW_9C32q76BHrGdxyqWk_", userName, 0xa6ff00, "Fin de partie", "Mode", mode); // logs sur discord de fin de

    Swal.fire({
        title: "Fin du jeu",
        showConfirmButton: false,
        allowEscapeKey: false, // Désactive la touche Échap
        allowOutsideClick: false,
        html: `🌟Félicitations ! Vous avez terminé toutes les coupes ! Vous pouvez dorénavent recommencer !<br/><br/>${(mode == "random1")?"💯 SCORE : <strong><span style='color:green'>"+score+"</span>/"+numberOfData+"</strong><br/><br/>":""}<div class="d-flex justify-content-center">`+
            `<div class="me-2"><button type="button" class="btn btn-info restart">Recommencer</button></div>`+
            `</div>`,
    });

    $(".restart").click(function() {
        allFrames = JSON.parse(JSON.stringify(dataYear["frames"]));;
        allFrames = allFrames.sort(() => Math.random() - 0.5);

        numberOfData = allFrames.length;
        main();
    });
}