# clojure-in-js

This project is an interpreter, written in JS, that can run a workable and growing subset of Clojure.

This project isn't something you'd ever want to use in production, since [Clojurescript](https://github.com/clojure/clojurescript) already exists. Rather, it's a way for me to play around with writing an interpreter.

Here's some simple code it can run today:

```clj
(def test-list (list 1 2 3))

(defn map2 [f theList]
  (if (not-empty theList)
    (cons (f (first theList)) (map2 f (rest theList)))
    (list)))

(defn inclist [theList]
  (map2 inc theList))

(let [test-list (list 2 3 4) test-map {:a true :b false}]
  (cons (get test-map :a) (inclist test-list))) ; returns (true 3 4 5)
```

To run, just require `src/index.js` from this module, which exports a function
that takes a program string as its sole argument.
