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
            <button @click="removeCard(card.id)">Удалить</button>
            <p v-if="card.completedDate">Завершено: {{ card.completedDate }}</p>
        </div>
    `,
    methods: {
        removeCard(cardId) {
            this.$emit('remove-card', cardId);
        },
        updateCard() {
            this.$emit('update-card', this.card);
        }
    }
});

// Компонент колонки заметок
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
});

// Главный компонент приложения заметок
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
        updateCard(card) {
            const completedItems = card.items.filter(item => item.completed).length;
            const totalItems = card.items.length;

            if (totalItems > 0) {
                const completionRate = completedItems / totalItems;
                if (completionRate > 0.5 && this.columns[0].cards.includes(card)) {
                    this.moveCard(card, 1);
                } else if (completionRate === 1 && this.columns[1].cards.includes(card)) {
                    this.moveCard(card, 2);
                    card.completedDate = new Date().toLocaleString();
                }
            }
            this.saveCards();
        },
        moveCard(card, targetColumnIndex) {
            for (let column of this.columns) {
                const index = column.cards.findIndex(c => c.id === card.id);
                if (index !== -1) {
                    column.cards.splice(index, 1);
                    this.columns[targetColumnIndex].cards.push(card);
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
});

new Vue({
    el: '#app'
});