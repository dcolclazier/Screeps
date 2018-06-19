
// export interface IKeyValueCollection<T>
// {
// 	Add(key: string, value: T): void;
// 	ContainsKey(key: string): boolean;
// 	Count(): number;
// 	Item(key: string): T;
// 	Keys(): string[]
// 	Remove(key: string): T | undefined;
// 	Values(): T[]
// }
// export class KeyValueCollection<T> implements IKeyValueCollection<T>{
// 	addRange(items: { [index: string]: T }): any
// 	{
// 		for (let key in items)
// 		{
// 			let item = items[key];
// 			this.Add(key, item);
// 		}
// 	}
// 	Add(key: string, value: T): void
// 	{
// 		if (!this.items.hasOwnProperty(key)) this.count++;

// 		this.items[key] = value;
// 	}
// 	ContainsKey(key: string): boolean
// 	{
// 		return (this.items.hasOwnProperty(key));
// 	}
// 	allItems(): { [index: string]: T }
// 	{
// 		return this.items;
// 	}
// 	Count(): number
// 	{
// 		return this.count;
// 	}
// 	Item(key: string): T
// 	{
// 		return this.items[key];
// 	}
// 	Keys(): string[]
// 	{
// 		let keySet: string[] = [];
// 		for (let prop in this.items)
// 		{
// 			if (this.items.hasOwnProperty(prop))
// 			{
// 				keySet.push(prop)
// 			}

// 		}
// 		return keySet;
// 	}
// 	Remove(key: string): T | undefined
// 	{
// 		let val = this.items[key];
// 		if(val == undefined) return undefined;
// 		delete this.items[key];
// 		this.count--;
// 		return val;
// 	}
// 	Values(): T[]
// 	{
// 		let valueSet: T[] = [];
// 		for (let prop in this.items)
// 		{
// 			if (this.items.hasOwnProperty(prop))
// 			{
// 				valueSet.push(this.items[prop])
// 			}

// 		}
// 		return valueSet;
// 	}
// 	items: { [index: string]: T } = {};
// 	private count: number = 0;

// }
// export class Queue<T>{
// 	pushRange(items: T[]): any
// 	{
// 		for (let i in items)
// 		{
// 			let item = items[i];
// 			this.push(item);
// 		}
// 	}
// 	clear(): void
// 	{
// 		this._store = [];
// 	}
// 	any(): boolean
// 	{
// 		return this._store.length > 0;
// 	}
// 	_store: T[] = [];
// 	toArray(): Array<T>
// 	{
// 		return this._store;
// 	}

// 	contains(item: T): boolean
// 	{
// 		for (const value in this._store)
// 		{
// 			let thing = this._store[value];
// 			if (thing = item) return true;
// 		}
// 		return false;
// 	}
// 	push(val: T): void
// 	{
// 		this._store.push(val);
// 	}
// 	peek()
// 	{
// 		let next = this._store.shift() as T;
// 		this._store.unshift(next);
// 		return next;
// 	}
// 	pop()
// 	{
// 		let test = this._store.shift() as T;
// 		return test;
// 	}
// 	count(): number
// 	{
// 		return this._store.length;
// 	}
// }

