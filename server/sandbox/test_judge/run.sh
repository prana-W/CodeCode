#!/bin/sh

g++ /code/main.cpp -o /code/main 2>/code/compile.err
if [ $? -ne 0 ]; then
    exit 100
fi

timeout 2 /code/main < /code/input.txt
exit $?
