import React from 'react';

function Test() {
  const [count, setCount] = React.useState(0);
  console.log(count);
  return (
    <div>
      <button type='button' onClick={() => setCount(count + 1)}>
        Click
      </button>
    </div>
  );
}

export default Test;
