<script>
    import SpreadSheetApp from './spreadsheet.svelte';

    let rows = 6;
    let cols = 5;
    let data = [
        ['Items', 'Quantity', 'Rate', 'Total'],
        ['Apples', '5', '40', '=B2*C2'],
        ['Oranges', '8', '25', '=B3*C3'],
        ['Mangoes', '4', '50', '=B4*C4'],
        ['', '', '', '=SUM(D2:D4)'],
        ['', 'Average', '=D2+D3+D4/3', '=D5/3']
    ];
</script>

<!-- {rows} {cols} -->
<!-- {data} -->
<SpreadSheetApp
    --background-color='white'
    --color='black'
/>

<!-- <button on:click={() => console.log(data)}>Print</button> -->