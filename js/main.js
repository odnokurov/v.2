Vue.component('note-card', {
        props: ['card'],
        template: `
        <div class="card" :style="{ backgroundColor: card.color }">
            <input type="text" v-model="card.title" placeholder="Заголовок карточки" />
            <label for="colorInput">Цвет:</label>
            <input type="color" v-model="card.color" />
            <ul>
                <li v-for="(item, itemIndex) in card.items" :key="itemIndex">
                    <input type="checkbox" v-model="item.completed" @change="updateCard">
                    <input type="text" v-model="item.text" placeholder="Пункт списка" />
                </li>
            </ul>
            <input type="text" v-model="newItemText" placeholder="Новый пункт списка" />
            <button @click="addItem" :disabled="itemCount >= 5">Добавить пункт</button>
            <button @click="removeCard(card.id)">Удалить</button>
            <p v-if="card.completedDate">Завершено: {{ card.completedDate }}</p>
        </div>
    `,
        data() {
            return {
                newItemText: '',
                localCard: {...this.card, items: [...this.card.items.map(i => ({...i}))]}
            }
        },
        watch: {
            card: {
                handler(newVal) {
                    this.localCard = {...newVal, items: [...newVal.items.map(i => ({...i}))]};
                },
                deep: true,
                immediate: true
            }
        },
        computed: {
            itemCount() {
                return this.localCard.items.length;
            }
        },
        methods: {
            addItem() {
                if (this.newItemText.trim() && this.itemCount < 5) {
                    this.localCard.items.push({text: this.newItemText, completed: false});
                    this.newItemText = '';
                    this.emitUpdate();
                }
            },
            emitUpdate() {
                this.$emit('update-card', this.localCard);
            },
            removeCard() {
                this.$emit('remove-card', this.card.id);
            }
        }
    })

Vue.component('note-column', {
    props: ['column'],
    template: `
        <div class="column">
            <h2>{{ column.title }}</h2>
            <note-card
                v-for="(card, cardIndex) in column.cards"
                :key="card.id"
                :card="card"
                @remove-card="$emit('remove-card', $event)"
                @update-card="$emit('update-card', $event)"
            ></note-card>
            <button v-if="canAddCard(column)" @click="$emit('add-card', column)">Добавить карточку</button>
        </div>
    `,
    methods: {
        canAddCard(column) {
            if (column.title === 'Столбец 1' && column.cards.length >= 3) return false;
            if (column.title === 'Столбец 2' && column.cards.length >= 5) return false;
            return true;
        }
    }
})

Vue.component('note-app', {
    data() {
        return {
            columns: [
                { title: 'Столбец 1', cards: [] },
                { title: 'Столбец 2', cards: [] },
                { title: 'Столбец 3', cards: [] }
            ],
            nextCardId: 1
        };
    },
    created() {
        this.loadCards();
    },
    methods: {
        loadCards() {
            const savedData = JSON.parse(localStorage.getItem('cards'));
            if (savedData) {
                this.columns = savedData.columns;
                this.nextCardId = savedData.nextCardId;
            }
        },
        saveCards() {
            localStorage.setItem('cards', JSON.stringify({ columns: this.columns, nextCardId: this.nextCardId }));
        },
        addCard(column) {
            const newCard = {
                id: this.nextCardId++,
                title: `Карточка ${this.nextCardId}`,
                color: '#f9f9f9',
                items: [
                    { text: 'Пункт 1', completed: false },
                    { text: 'Пункт 2', completed: false },
                    { text: 'Пункт 3', completed: false }
                ],
                completedDate: null
            };
            column.cards.push(newCard);
            this.saveCards();
        },
        removeCard(cardId) {
            for (let column of this.columns) {
                const index = column.cards.findIndex(card => card.id === cardId);
                if (index !== -1) {
                    column.cards.splice(index, 1);
                    this.saveCards();
                    break;
                }
            }
        },
        updateCard(updatedCard) {
            for (let col of this.columns) {
                const idx = col.cards.findIndex(c => c.id === updatedCard.id);
                if (idx !== -1) {
                    col.cards[idx] = { ...updatedCard };
                    this.checkAndMoveCard(col.cards[idx]);
                    this.saveCards();
                    break;
                }
            }
        },

        checkAndMoveCard(card) {
            const completed = card.items.filter(i => i.completed).length;
            const total = card.items.length;
            if (total === 0) return;

            const progress = completed / total;

            if (progress > 0.5 && this.columns[0].cards.some(c => c.id === card.id)) {
                this.moveCard(card.id, 1);
                this.saveCards();
            }
            else if (progress === 1 && this.columns[1].cards.some(c => c.id === card.id)) {
                this.moveCard(card.id, 2);
                card.completedDate = new Date().toLocaleString();
                this.saveCards();
            }
        },
        moveCard(cardId, targetIndex) {
            for (let col of this.columns) {
                const idx = col.cards.findIndex(c => c.id === cardId);
                if (idx !== -1) {
                    const [card] = col.cards.splice(idx, 1);
                    this.columns[targetIndex].cards.push(card);
                    break;
                }
            }
        }
    },
    template: `
        <div>
            <div class="columns">
                <note-column
                    v-for="(column, index) in columns"
                    :key="index"
                    :column="column"
                    @remove-card="removeCard"
                    @update-card="updateCard"
                    @add-card="addCard"
                ></note-column>
            </div>
        </div>
    `
}),

new Vue({
    el: '#app'
});