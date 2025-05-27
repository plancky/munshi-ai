export const wrapText = (
    text: string,
    width: number,
    font: any,
    fontSize: number 
) => {
    const words = text.split(" ");
    let line = "";
    let result = "";
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        if (testWidth > width) {
            result += line + "\n";
            line = words[n] + " ";
        } else {
            line = testLine;
        }
    }
    result += line;
    return result;
};
