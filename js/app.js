let wSLCAN = new WebSLCAN();

wSLCAN.setOnConnectCallback(() => {
    console.log("Connected to WebSLCAN");
});

wSLCAN.setOnDisconnectCallback(() => {
    console.log("Disconnected from WebSLCAN");
});

wSLCAN.setOnMessageCallback((id, data) => {

    if (id == 0x201 && data.length >= 4) {
        // Pedal input ADC values
        let ADC1 = ((data[0] << 8) | data[1]) * (5.0 / 3030);
        let ADC2 = ((data[2] << 8) | data[3]) * (5.0 / 3030);
        
        // Update progress bars
        const adc1Progress = document.getElementById('adc1-progress');
        const adc2Progress = document.getElementById('adc2-progress');
        const adc1Value = document.getElementById('adc1-value');
        const adc2Value = document.getElementById('adc2-value');
        
        if (adc1Progress && adc2Progress) {
            adc1Progress.value = ADC1;
            adc2Progress.value = ADC2;
            adc1Value.textContent = `${ADC1.toFixed(2)}V`;
            adc2Value.textContent = `${ADC2.toFixed(2)}V`;
        }
    }
});

function sendingLoop() {
    // values between 0 and 5000 for 0V to 5V
    DAC1 = Math.floor(parseFloat(document.getElementById('dac1-slider').value) * 1000);
    DAC2 = Math.floor(parseFloat(document.getElementById('dac2-slider').value) * 1000);

    // Your sending loop logic here
    wSLCAN.sendSingleFrame(0x200, [
        (DAC1 >> 8) & 0xFF,
        DAC1 & 0xFF,
        (DAC2 >> 8) & 0xFF,
        DAC2 & 0xFF
    ]);
    console.log(`Sent DAC1: ${DAC1}, DAC2: ${DAC2}`);
}

document.addEventListener('DOMContentLoaded', () => {
    const pedalInputsContent = document.createElement('div');
    pedalInputsContent.innerHTML = `
        <div style="padding: 20px;">
            <div class="progress-container">
                <label for="adc1-progress">ADC1:<span id="adc1-value">0.00V</span></label>
                <progress id="adc1-progress" value="0" max="5" style="width: 100%; height: 20px; margin: 10px 0;"></progress>
            </div>
            <div class="progress-container" style="margin-top: 20px;">
                <label for="adc2-progress">ADC2:<span id="adc2-value">0.00V</span></label>
                <progress id="adc2-progress" value="0" max="5" style="width: 100%; height: 20px; margin: 10px 0;"></progress>
            </div>
        </div>      
    `;

//    const pedalOutputsContent = document.createElement('div');
//    pedalOutputsContent.innerHTML = `
//        <div style="padding: 20px;">
//            <div class="progress-container">
//                <label for="dac1-progress">DAC1:<span id="dac1-value">0.00V</span></label>
//                <progress id="dac1-progress" value="0" max="5" style="width: 100%; height: 20px; margin: 10px 0;"></progress>
//            </div>
//            <div class="progress-container" style="margin-top: 20px;">
//                <label for="dac2-progress">DAC2:<span id="dac2-value">0.00V</span></label>
//                <progress id="dac2-progress" value="0" max="5" style="width: 100%; height: 20px; margin: 10px 0;"></progress>
//            </div>
//       </div>
//    `;

    const pedalControlsContent = document.createElement('div');
    pedalControlsContent.innerHTML = `
        <div style="padding: 20px;">
            <div class="control-container">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <label for="dac1-slider">DAC1:</label>
                    <span id="dac1-slider-value">0.00V</span>
                </div>
                <input type="range" id="dac1-slider" min="0" max="5" step="0.01" value="0" 
                    style="width: 100%; margin-bottom: 15px;"
                    oninput="document.getElementById('dac1-slider-value').textContent = this.value + 'V'">
                    
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <label for="dac2-slider">DAC2:</label>
                    <span id="dac2-slider-value">0.00V</span>
                </div>
                <input type="range" id="dac2-slider" min="0" max="5" step="0.01" value="0" 
                    style="width: 100%; margin-bottom: 20px;"
                    oninput="document.getElementById('dac2-slider-value').textContent = this.value + 'V'">
                <!--
                <div style="display: flex; gap: 10px; align-items: center;">
                    <select id="dac-mode" style="flex: 1;">
                        <option value="copy">Copy</option>
                        <option value="override">Override</option>
                    </select>
                    <button id="set-dac-mode" style="width: 100px;">Set Mode</button>
                </div> 
                -->
            </div>
        </div>
    `;

    const pedalInputsBox = new WinBox({
        title: "Pedal Inputs",
        mount: pedalInputsContent,
        class: ["no-full"],
        x: "20px",
        y: "60px",
        width: "300px",
        height: "260px",
        root: document.body,
        top: "40px",
        minwidth: "300px",
        minheight: "260px",
        nooverflow: true
    });

//    const pedalOutputsBox = new WinBox({
//        title: "Pedal Outputs",
//        mount: pedalOutputsContent,
//        class: ["no-full"],
//        x: "340px",
//        y: "60px",
//        width: "300px",
//        height: "260px",
//        root: document.body,
//        top: "40px",
//        minwidth: "300px",
//        minheight: "260px",
//        nooverflow: true
//    });

    const pedalControlsBox = new WinBox({
        title: "Pedal Controls",
        mount: pedalControlsContent,
        class: ["no-full"],
        //x: "660px",
        x: "340px",
        y: "60px",
        width: "300px",
        height: "260px",
        root: document.body,
        top: "40px",
        minwidth: "300px",
        minheight: "260px",
        nooverflow: true
    });
});

document.getElementById('connect-btn').addEventListener('click', async () => {
    await wSLCAN.connect();
    await wSLCAN.open(WebSLCAN.canSpeed._500K);
    setInterval(sendingLoop, 100);
});

