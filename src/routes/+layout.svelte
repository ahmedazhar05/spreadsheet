<header>
    <h1>Spreadsheet</h1>
</header>
<div class="container">
    <slot/>
</div>

<style>
    :root {
        --theme: dodgerblue;
    }
    :global(body) {
        margin: 0;
        min-height: 100vh;
        font-family: Verdana;
        background-color: lightslategray;
        color: white;
    }
    :global(input) {
        font-family: Verdana;
    }
    header {
        width: calc(100% - 40px);
        margin-bottom: 20px;

        & h1 {
            color: white;
            margin: 0;
            text-align: center;
            text-shadow: 3px 3px 3px var(--theme);
            font-size: 3em;
        }
    }
    header,
    div.container {
        padding: 20px;
    }
    div.container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
</style>