# Interface: ClosePathObject

Path object for closing a trustline.
Contains all relevant information for closing a trustline.

## Hierarchy

- **ClosePathObject**

## Index

### Properties

- [feePayer](_typings_.closepathobject.md#feepayer)
- [maxFees](_typings_.closepathobject.md#maxfees)
- [path](_typings_.closepathobject.md#path)
- [value](_typings_.closepathobject.md#value)

## Properties

### feePayer

• **feePayer**: _[FeePayer](../enums/_typings_.feepayer.md)_

Payer of thee for the closing transaction

---

### maxFees

• **maxFees**: _[Amount](_typings_.amount.md)_

Maximal fees that can occur for closing

---

### path

• **path**: _string[]_

Close path for triangulation

---

### value

• **value**: _[Amount](_typings_.amount.md)_

Estimated value to be transferred for closing
