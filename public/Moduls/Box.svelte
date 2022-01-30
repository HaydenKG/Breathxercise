<script>
    export let show;

    /*----audio*/
    let inhaleAudio = new Audio("./media/Inhale.mp3");
    let exhaleAudio = new Audio("./media/Exhale.mp3");
    let boxtimer = "";
    let boxAnimation = "";

    let instruction = "Inhale <br> for 4";
    let countdown = 4;
    let cycle = 0;
    let round = 1;
    let started = false;
    let height = 30;
    let inhale = 0;

    function returnToLanding() {
        show = 0;
        clearInterval(boxtimer);
        clearInterval(boxAnimation);
        inhaleAudio.pause();
        exhaleAudio.pause();
    }

    function startSession() {
        started = true;
        boxbreathing();
    }

    function boxbreathing() {
        boxtimer = setInterval(() => {
            ++cycle;

            if (cycle == 1) playAudio(0);
            if (cycle == 9) playAudio(1);
            if (cycle == 16) {
                cycle = 0;
                round++;
            } else if (cycle <= 4) {
                inhale = 1;
                instruction = "Inhale <br> for " + countdown--;
            } else if (
                (cycle > 4 && cycle <= 8) ||
                (cycle > 12 && cycle < 15)
            ) {
                inhale = 0;
                instruction = "Hold it";
            } else if (cycle > 8 && cycle < 13) {
                inhale = -1;
                instruction = "Exhale <br> for " + countdown--;
            }
            if (round > 3) {
                round = 3;
                clearInterval(boxtimer);
                clearInterval(boxAnimation);
                instruction = "Well <br> done";
                setTimeout(reset, 4000);
            }
            if (countdown == 0) countdown = 4;
        }, 1000);

        boxAnimation = setInterval(() => {
            if (inhale > 0) {
                height += 0.025;
            } else if (inhale < 0) {
                height -= 0.025;
            }
        }, 7);
    }

    function reset() {
        started = false;
        round = 1;
        instruction = "";
    }

    // 0 = inhale || 1 = exhale
    function playAudio(variant) {
        if (audio) {
            if (variant == 0) inhaleAudio.play();
            if (variant == 1) exhaleAudio.play();
        }
    }

    function fade(node, { delay = 0, duration = 400 }) {
        const o = +getComputedStyle(node).opacity;

        return {
            delay,
            duration,
            css: (t) => `opacity: ${t * o}`,
        };
    }

    let audio = true;
    function audioController() {
        audio = !audio;
        if (!audio) {
            inhaleAudio.pause();
            exhaleAudio.pause();
        }
    }
</script>

<main>
    <button id="home-btn" on:click={() => returnToLanding()}>
        <i class="material-icons" style="font-size: 38px;">chevron_left</i>
    </button>

    <button id="mute-btn" on:click={() => audioController()}>
        {#if audio}
            <i class="material-icons" style="font-size: 30px;">volume_up</i>
        {:else}
            <i class="material-icons" style="font-size: 30px;">volume_off</i>
        {/if}
    </button>
    <div class="boxbreathing" in:fade>
        <h2 id="round-display">Round: {round} / 3</h2>
        <img
            id="box"
            src="./media/Rectangle.png"
            alt="Visualization of the box breathing pattern that animates depending on the status"
            style="height: {height}%"
        />
        {#if !started}
            <button id="start-btn" on:click={() => startSession()} in:fade>
                <i class="material-icons">play_arrow</i>
            </button>
        {:else}
            <h1 in:fade out:fade>{@html instruction}</h1>
        {/if}
    </div>
</main>

<style>
    .boxbreathing {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
    }

    #box {
        z-index: -1;
        position: absolute;
    }
</style>
