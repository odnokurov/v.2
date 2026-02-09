Vue.component ('cards', {
    template: `
            <div class="column" v-for="(column, index) in columns" :key="index">
                <h2>Столбец {{ index + 1 }}</h2>
                <div v-if="!isColumnLocked(index)">
                    <div class="card" v-for="(card, cardIndex) in column.cards" :key="cardIndex">
                        <h3>{{ card.title }}</h3>
                        <ul>
                            <li v-for="(item, itemIndex) in card.items" :key="itemIndex">\n' +
                                <input type="checkbox" v-model="item.completed" @change="updateCard(card)">
                                <span :class="{ completed: item.completed }">{{ item.text }}</span>
                            </li>
                        </ul>
                        <button @click="removeCard(index, cardIndex)">Удалить карточку</button>
                </div>
                    <button @click="addCard(index)">Добавить карточку</button>
              </div>
                <p v-if="isColumnLocked(index)">Столбец заблокирован для редактирования</p>
            </div>`,
    data(){return{
        columns: [
            { cards: [] },
            { cards: [] },
            { cards: [] }
        ]
    }},
    created() {
        this.loadData();
    },
    methods:{
        addCard(columnIndex) {
            const title = prompt("Введите заголовок карточки:");
            if (title) {
                const items = [];
                for (let i = 0; i < 3; i++) {
                    const itemText = prompt(`Введите текст пункта ${i + 1}:`);
                    if (itemText) {
                        items.push({ text: itemText, completed: false });
                    }
                }
                this.columns[columnIndex].cards.push({ title, items });
                this.saveData();
            }
        },
        removeCard(columnIndex, cardIndex) {
            this.columns[columnIndex].cards.splice(cardIndex, 1);
            this.saveData();
        },
        updateCard(card) {
            const totalItems = card.items.length;
            const completedItems = card.items.filter(item => item.completed).length;

            if (completedItems > 0.5 * totalItems) {
                if (this.columns[0].cards.includes(card)) {
                    this.moveCardToColumn(card, 1);
                } else if (completedItems === totalItems) {
                    this.moveCardToColumn(card, 2);
                    card.completedAt = new Date().toLocaleString(); // Сохраняем дату выполнения
                }
            }
            this.saveData();
        },
        moveCardToColumn(card, targetColumnIndex) {
            const sourceColumnIndex = this.columns.findIndex(column => column.cards.includes(card));
            this.columns[sourceColumnIndex].cards.splice(this.columns[sourceColumnIndex].cards.indexOf(card), 1);
            this.columns[targetColumnIndex].cards.push(card);
        },
        isColumnLocked(index) {
            if (index === 0) {
                return this.columns[1].cards.length >= 5 && this.columns[0].cards.some(card => {
                    const totalItems = card.items.length;
                    const completedItems = card.items.filter(item => item.completed).length;
                    return completedItems > 0.5 * totalItems;
                });
            }
            return false;
        },
        saveData() {
            localStorage.setItem('noteAppData', JSON.stringify(this.columns));
        },
        loadData() {
            const data = localStorage.getItem('noteAppData');
            if (data) {
                this.columns = JSON.parse(data);
            }
        }
    },
    computed:{

    },

})
let app = new Vue({
    el: '#app',
})