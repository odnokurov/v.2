Vue.component('note-card', {
    props: ['card', 'disabled'],
    template: `
        <div class="card" :style="{ backgroundColor: card.color }">
            <input type="text" v-model="localCard.title" placeholder="Заголовок карточки" :disabled="disabled" />
            <label for="colorInput">Цвет:</label>
            <input type="color" v-model="localCard.color" :disabled="disabled" />
            <ul>
                <li v-for="(item, itemIndex) in localCard.items" :key="itemIndex">
                    <input type="checkbox" v-model="item.completed" :disabled="disabled" @change="handleCheckboxChange">
                    <input type="text" v-model="item.text" placeholder="Пункт списка" :disabled="disabled" />
                </li>
            </ul>
            <input type="text" v-model="newItemText" placeholder="Новый пункт списка" :disabled="disabled" />
            <button @click="addItem" :disabled="disabled || itemCount >= 5">Добавить пункт</button>
            <button @click="removeCard" :disabled="disabled">Удалить карточку</button>
            <p v-if="card.completedDate">Завершено: {{ card.completedDate }}</p>
        </div>
    `,
    data() {
        return {
            newItemText: '',
            localCard: null
        };
    },
    watch: {
        card: {
            handler(newVal) {
                this.localCard = {
                    ...newVal,
                    items: newVal.items.map(i => ({ ...i }))
                };
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
        handleCheckboxChange() {
            if (this.disabled) return;
            this.emitUpdate();
        },
        addItem() {
            if (this.disabled || this.newItemText.trim() === '' || this.itemCount >= 5) return;
            this.localCard.items.push({ text: this.newItemText, completed: false });
            this.newItemText = '';
            this.emitUpdate();
        },
        emitUpdate() {
            this.$emit('update-card', this.localCard);
        },
        removeCard() {
            if (this.disabled) return;
            this.$emit('remove-card', this.card.id);
        }
    }
});

Vue.component('note-column', {
    props: ['column', 'disabled'],
    template: `
        <div class="column">
            <h2>{{ column.title }}</h2>
            <note-card
                v-for="(card, cardIndex) in column.cards"
                :key="card.id"
                :card="card"
                :disabled="disabled"
                @remove-card="$emit('remove-card', $event)"
                @update-card="$emit('update-card', $event)"
            ></note-card>
            <button v-if="canAddCard" @click="$emit('add-card', column)" :disabled="disabled">Добавить карточку</button>
        </div>
    `,
    computed: {
        canAddCard() {
            if (this.disabled) return false;
            if (this.column.title === 'Столбец 1' && this.column.cards.length >= 3) return false;
            if (this.column.title === 'Столбец 2' && this.column.cards.length >= 5) return false;
            return true;
        }
    }
});

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
    computed: {
        isColumn1Blocked() {
            if (this.columns[1].cards.length < 5) return false;
            return this.columns[0].cards.some(card => {
                const completed = card.items.filter(i => i.completed).length;
                return completed / card.items.length > 0.5;
            });
        }
    },
    created() {
        this.loadCards();
    },
    methods: {
        loadCards() {
            const saved = localStorage.getItem('cards');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.columns = parsed.columns;
                this.nextCardId = parsed.nextCardId || 1;
            }
        },
        saveCards() {
            localStorage.setItem('cards', JSON.stringify({
                columns: this.columns,
                nextCardId: this.nextCardId
            }));
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
            for (let col of this.columns) {
                const idx = col.cards.findIndex(c => c.id === cardId);
                if (idx !== -1) {
                    col.cards.splice(idx, 1);
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
                if (this.columns[1].cards.length < 5) {
                    this.moveCard(card.id, 1);
                }
            }
            else if (progress === 1 && this.columns[1].cards.some(c => c.id === card.id)) {
                this.moveCard(card.id, 2);
                card.completedDate = new Date().toLocaleString('ru-RU');
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
                    :disabled="index === 0 && isColumn1Blocked"
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